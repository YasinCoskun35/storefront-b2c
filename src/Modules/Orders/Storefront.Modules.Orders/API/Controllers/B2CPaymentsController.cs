using Iyzipay;
using Iyzipay.Model;
using Iyzipay.Request;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Storefront.Modules.Orders.Core.Domain.Entities;
using Storefront.Modules.Orders.Infrastructure.Persistence;

namespace Storefront.Modules.Orders.API.Controllers;

[ApiController]
[Route("api/b2c/payments")]
public class B2CPaymentsController : ControllerBase
{
    private readonly OrdersDbContext _context;
    private readonly IConfiguration _configuration;

    public B2CPaymentsController(OrdersDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    private Options GetIyzicoOptions() => new Options
    {
        ApiKey = _configuration["Iyzico:ApiKey"] ?? throw new InvalidOperationException("Iyzico:ApiKey not configured"),
        SecretKey = _configuration["Iyzico:SecretKey"] ?? throw new InvalidOperationException("Iyzico:SecretKey not configured"),
        BaseUrl = _configuration["Iyzico:BaseUrl"] ?? "https://sandbox-api.iyzipay.com"
    };

    [HttpPost("initialize")]
    public async Task<IActionResult> InitializePayment([FromBody] InitializePaymentRequest request, CancellationToken ct)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, ct);

        if (order is null)
            return NotFound(new { message = "Order not found" });

        var options = GetIyzicoOptions();
        var callbackUrl = _configuration["Iyzico:CallbackUrl"] ?? $"{Request.Scheme}://{Request.Host}/api/b2c/payments/callback";

        var conversationId = Guid.NewGuid().ToString();

        var initRequest = new CreateCheckoutFormInitializeRequest
        {
            Locale = Locale.TR.ToString(),
            ConversationId = conversationId,
            Price = (order.TotalAmount ?? 0).ToString("F2", System.Globalization.CultureInfo.InvariantCulture),
            PaidPrice = (order.TotalAmount ?? 0).ToString("F2", System.Globalization.CultureInfo.InvariantCulture),
            Currency = Currency.TRY.ToString(),
            BasketId = order.Id,
            PaymentGroup = PaymentGroup.PRODUCT.ToString(),
            CallbackUrl = callbackUrl,
            EnabledInstallments = new List<int> { 2, 3, 6, 9 },
            Buyer = new Buyer
            {
                Id = order.GuestEmail ?? order.Id,
                Name = order.GuestName?.Split(' ').FirstOrDefault() ?? "Guest",
                Surname = order.GuestName?.Split(' ').Skip(1).LastOrDefault() ?? "User",
                GsmNumber = order.GuestPhone ?? "+905555555555",
                Email = order.GuestEmail ?? "guest@example.com",
                IdentityNumber = "74300864791",
                RegistrationAddress = order.DeliveryAddress,
                Ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "85.34.78.112",
                City = order.DeliveryCity,
                Country = order.DeliveryCountry
            },
            ShippingAddress = new Address
            {
                ContactName = order.GuestName ?? "Guest",
                City = order.DeliveryCity,
                Country = order.DeliveryCountry,
                Description = order.DeliveryAddress,
                ZipCode = order.DeliveryPostalCode
            },
            BillingAddress = new Address
            {
                ContactName = order.GuestName ?? "Guest",
                City = order.DeliveryCity,
                Country = order.DeliveryCountry,
                Description = order.DeliveryAddress,
                ZipCode = order.DeliveryPostalCode
            },
            BasketItems = order.Items.Select(item => new BasketItem
            {
                Id = item.ProductId,
                Name = item.ProductName,
                Category1 = "Furniture",
                ItemType = BasketItemType.PHYSICAL.ToString(),
                Price = (item.TotalPrice ?? 0).ToString("F2", System.Globalization.CultureInfo.InvariantCulture)
            }).ToList()
        };

        var checkoutForm = await Task.Run(() =>
            CheckoutFormInitialize.Create(initRequest, options), ct);

        if (checkoutForm.Status != "success")
            return BadRequest(new { message = checkoutForm.ErrorMessage });

        // Save payment transaction
        var transaction = new PaymentTransaction
        {
            OrderId = order.Id,
            ConversationId = conversationId,
            Token = checkoutForm.Token,
            PaymentPageUrl = checkoutForm.PaymentPageUrl,
            Amount = order.TotalAmount ?? 0,
            Currency = "TRY",
            CreatedAt = DateTime.UtcNow
        };

        _context.PaymentTransactions.Add(transaction);
        await _context.SaveChangesAsync(ct);

        return Ok(new
        {
            token = checkoutForm.Token,
            paymentPageUrl = checkoutForm.PaymentPageUrl
        });
    }

    [HttpPost("callback")]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromForm] string? token, [FromQuery] string? token2, CancellationToken ct)
    {
        var paymentToken = token ?? token2;
        if (string.IsNullOrEmpty(paymentToken))
            return BadRequest(new { message = "Token is required" });

        var options = GetIyzicoOptions();

        var retrieveRequest = new RetrieveCheckoutFormRequest
        {
            Locale = Locale.TR.ToString(),
            Token = paymentToken
        };

        var form = await Task.Run(() =>
            CheckoutForm.Retrieve(retrieveRequest, options), ct);

        var transaction = await _context.PaymentTransactions
            .FirstOrDefaultAsync(t => t.Token == paymentToken, ct);

        if (transaction is not null)
        {
            transaction.RawResponse = form.Status;
            transaction.UpdatedAt = DateTime.UtcNow;

            if (form.Status == "success" && form.PaymentStatus == "SUCCESS")
            {
                transaction.Status = PaymentStatus.Success;

                if (transaction.OrderId is not null)
                {
                    var order = await _context.Orders.FindAsync([transaction.OrderId], cancellationToken: ct);
                    if (order is not null)
                    {
                        order.Status = Core.Domain.Enums.OrderStatus.Confirmed;
                        order.UpdatedAt = DateTime.UtcNow;
                        order.ConfirmedAt = DateTime.UtcNow;
                    }
                }
            }
            else
            {
                transaction.Status = PaymentStatus.Failed;
                transaction.ErrorCode = form.ErrorCode;
                transaction.ErrorMessage = form.ErrorMessage;
            }

            await _context.SaveChangesAsync(ct);
        }

        var successUrl = _configuration["Iyzico:SuccessUrl"] ?? "/checkout/success";
        var failUrl = _configuration["Iyzico:FailUrl"] ?? "/checkout/fail";

        var redirectUrl = (form.Status == "success" && form.PaymentStatus == "SUCCESS")
            ? $"{successUrl}?orderId={transaction?.OrderId}"
            : $"{failUrl}?error={Uri.EscapeDataString(form.ErrorMessage ?? "Payment failed")}";

        return Redirect(redirectUrl);
    }
}

public record InitializePaymentRequest(string OrderId);
