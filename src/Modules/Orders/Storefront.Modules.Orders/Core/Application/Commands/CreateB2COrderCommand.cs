using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Orders.Core.Domain.Entities;
using Storefront.Modules.Orders.Core.Domain.Enums;
using Storefront.Modules.Orders.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Orders.Core.Application.Commands;

public record CreateB2COrderCommand(
    string GuestId,
    string GuestEmail,
    string GuestName,
    string? GuestPhone,
    string DeliveryAddress,
    string DeliveryCity,
    string DeliveryState,
    string DeliveryPostalCode,
    string DeliveryCountry,
    string? DeliveryNotes,
    string? Notes
) : IRequest<Result<string>>;

public class CreateB2COrderCommandHandler : IRequestHandler<CreateB2COrderCommand, Result<string>>
{
    private readonly OrdersDbContext _context;
    private readonly IProductPriceResolver _priceResolver;

    public CreateB2COrderCommandHandler(OrdersDbContext context, IProductPriceResolver priceResolver)
    {
        _context = context;
        _priceResolver = priceResolver;
    }

    public async Task<Result<string>> Handle(CreateB2COrderCommand request, CancellationToken cancellationToken)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.GuestId == request.GuestId && c.IsActive, cancellationToken);

        if (cart is null || !cart.Items.Any())
            return Error.Validation("Order.EmptyCart", "Cannot create order from empty cart");

        var orderCount = await _context.Orders.CountAsync(cancellationToken);
        var orderNumber = $"B2C-{DateTime.UtcNow:yyyy}-{(orderCount + 1):D4}";

        var order = new Order
        {
            OrderNumber = orderNumber,
            OrderType = OrderType.DirectPurchase,
            GuestEmail = request.GuestEmail,
            GuestName = request.GuestName,
            GuestPhone = request.GuestPhone,
            Status = OrderStatus.Pending,
            DeliveryAddress = request.DeliveryAddress,
            DeliveryCity = request.DeliveryCity,
            DeliveryState = request.DeliveryState,
            DeliveryPostalCode = request.DeliveryPostalCode,
            DeliveryCountry = request.DeliveryCountry,
            DeliveryNotes = request.DeliveryNotes,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            SubmittedAt = DateTime.UtcNow
        };

        decimal subTotal = 0;

        foreach (var cartItem in cart.Items)
        {
            var unitPrice = await _priceResolver.GetPriceAsync(cartItem.ProductId, cancellationToken) ?? 0;
            var totalPrice = unitPrice * cartItem.Quantity;
            subTotal += totalPrice;

            order.Items.Add(new OrderItem
            {
                OrderId = order.Id,
                ProductId = cartItem.ProductId,
                ProductName = cartItem.ProductName,
                ProductSKU = cartItem.ProductSKU,
                ProductImageUrl = cartItem.ProductImageUrl,
                Quantity = cartItem.Quantity,
                ColorChartId = cartItem.ColorChartId,
                ColorChartName = cartItem.ColorChartName,
                ColorOptionId = cartItem.ColorOptionId,
                ColorOptionName = cartItem.ColorOptionName,
                ColorOptionCode = cartItem.ColorOptionCode,
                CustomizationNotes = cartItem.CustomizationNotes,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice,
                DisplayOrder = 0,
                CreatedAt = DateTime.UtcNow
            });
        }

        order.SubTotal = subTotal;
        order.TotalAmount = subTotal; // shipping/tax calculated separately
        order.Currency = "TRY";

        order.Comments.Add(new OrderComment
        {
            OrderId = order.Id,
            Content = $"B2C order created by {request.GuestName} ({request.GuestEmail}) with {cart.Items.Count} item(s)",
            Type = CommentType.StatusChange,
            AuthorId = request.GuestId,
            AuthorName = request.GuestName,
            AuthorType = "Guest",
            IsSystemGenerated = true,
            CreatedAt = DateTime.UtcNow
        });

        _context.Orders.Add(order);

        cart.IsActive = false;
        cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result<string>.Success(order.Id);
    }
}
