using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Orders.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Orders.Core.Application.Commands;

public record UpdateCartItemQuantityCommand(
    string CartItemId,
    int Quantity,
    string? PartnerUserId = null,
    string? GuestId = null
) : IRequest<Result>;

public class UpdateCartItemQuantityCommandHandler : IRequestHandler<UpdateCartItemQuantityCommand, Result>
{
    private readonly OrdersDbContext _context;

    public UpdateCartItemQuantityCommandHandler(OrdersDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdateCartItemQuantityCommand request, CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
            return Error.Validation("CartItem.InvalidQuantity", "Quantity must be greater than zero");

        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId, cancellationToken);

        if (cartItem is null)
            return Error.NotFound("CartItem.NotFound", "Cart item not found");

        var cart = cartItem.Cart;

        // Verify ownership
        if (!string.IsNullOrEmpty(request.PartnerUserId) && cart.PartnerUserId != request.PartnerUserId)
            return Error.Failure("Cart.Unauthorized", "Not authorized to modify this cart");

        if (!string.IsNullOrEmpty(request.GuestId) && cart.GuestId != request.GuestId)
            return Error.Failure("Cart.Unauthorized", "Not authorized to modify this cart");

        cartItem.Quantity = request.Quantity;
        cartItem.UpdatedAt = DateTime.UtcNow;
        cart.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
