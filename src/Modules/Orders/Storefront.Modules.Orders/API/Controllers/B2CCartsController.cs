using MediatR;
using Microsoft.AspNetCore.Mvc;
using Storefront.Modules.Orders.Core.Application.Commands;
using Storefront.Modules.Orders.Core.Application.Queries;

namespace Storefront.Modules.Orders.API.Controllers;

[ApiController]
[Route("api/cart")]
public class B2CCartsController : ControllerBase
{
    private readonly IMediator _mediator;

    public B2CCartsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string? GetGuestId() => Request.Headers["X-Guest-Id"].FirstOrDefault();

    [HttpGet]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var guestId = GetGuestId();
        if (string.IsNullOrEmpty(guestId))
            return BadRequest(new { message = "X-Guest-Id header is required" });

        var result = await _mediator.Send(new GetCartQuery(GuestId: guestId), ct);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(500, result.Error);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request, CancellationToken ct)
    {
        var guestId = GetGuestId();
        if (string.IsNullOrEmpty(guestId))
            return BadRequest(new { message = "X-Guest-Id header is required" });

        var command = new AddToCartCommand(
            PartnerUserId: null,
            PartnerCompanyId: null,
            GuestId: guestId,
            ProductId: request.ProductId,
            ProductName: request.ProductName,
            ProductSKU: request.ProductSKU,
            ProductImageUrl: request.ProductImageUrl,
            Quantity: request.Quantity,
            ColorChartId: request.ColorChartId,
            ColorChartName: request.ColorChartName,
            ColorOptionId: request.ColorOptionId,
            ColorOptionName: request.ColorOptionName,
            ColorOptionCode: request.ColorOptionCode,
            CustomizationNotes: request.CustomizationNotes
        );

        var result = await _mediator.Send(command, ct);
        return result.IsSuccess ? Ok(new { cartId = result.Value }) : BadRequest(result.Error);
    }

    [HttpPut("items/{itemId}")]
    public async Task<IActionResult> UpdateQuantity(string itemId, [FromBody] UpdateQuantityRequest request, CancellationToken ct)
    {
        var guestId = GetGuestId();
        if (string.IsNullOrEmpty(guestId))
            return BadRequest(new { message = "X-Guest-Id header is required" });

        var command = new UpdateCartItemQuantityCommand(itemId, request.Quantity, GuestId: guestId);
        var result = await _mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(result.Error),
                "Unauthorized" => Forbid(),
                _ => BadRequest(result.Error)
            };
        }

        return NoContent();
    }

    [HttpDelete("items/{itemId}")]
    public async Task<IActionResult> RemoveItem(string itemId, CancellationToken ct)
    {
        var guestId = GetGuestId();
        if (string.IsNullOrEmpty(guestId))
            return BadRequest(new { message = "X-Guest-Id header is required" });

        var command = new RemoveCartItemCommand(itemId, GuestId: guestId);
        var result = await _mediator.Send(command, ct);

        if (!result.IsSuccess)
        {
            return result.Error.Type switch
            {
                "NotFound" => NotFound(result.Error),
                "Unauthorized" => Forbid(),
                _ => BadRequest(result.Error)
            };
        }

        return NoContent();
    }
}

public record AddToCartRequest(
    string ProductId,
    string ProductName,
    string ProductSKU,
    string? ProductImageUrl,
    int Quantity,
    string? ColorChartId,
    string? ColorChartName,
    string? ColorOptionId,
    string? ColorOptionName,
    string? ColorOptionCode,
    string? CustomizationNotes
);

public record UpdateQuantityRequest(int Quantity);
