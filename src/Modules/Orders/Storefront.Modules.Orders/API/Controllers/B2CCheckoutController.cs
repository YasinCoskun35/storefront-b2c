using MediatR;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Orders.Core.Application.Commands;

namespace Storefront.Modules.Orders.API.Controllers;

[ApiController]
[Route("api/cart/checkout")]
public class B2CCheckoutController : ControllerBase
{
    private readonly IMediator _mediator;

    public B2CCheckoutController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string? GetGuestId() => Request.Headers["X-Guest-Id"].FirstOrDefault();

    [HttpPost]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request, CancellationToken ct)
    {
        var guestId = GetGuestId();
        if (string.IsNullOrEmpty(guestId))
            return BadRequest(new { message = "X-Guest-Id header is required" });

        var command = new CreateB2COrderCommand(
            GuestId: guestId,
            GuestEmail: request.GuestEmail,
            GuestName: request.GuestName,
            GuestPhone: request.GuestPhone,
            DeliveryAddress: request.DeliveryAddress,
            DeliveryCity: request.DeliveryCity,
            DeliveryState: request.DeliveryState,
            DeliveryPostalCode: request.DeliveryPostalCode,
            DeliveryCountry: request.DeliveryCountry,
            DeliveryNotes: request.DeliveryNotes,
            Notes: request.Notes
        );

        var result = await _mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return result.Error.Type switch
            {
                "Validation" => BadRequest(new { message = result.Error.Message }),
                _ => StatusCode(500, new { message = result.Error.Message })
            };
        }

        return Ok(new { orderId = result.Value });
    }
}

public record CheckoutRequest(
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
);
