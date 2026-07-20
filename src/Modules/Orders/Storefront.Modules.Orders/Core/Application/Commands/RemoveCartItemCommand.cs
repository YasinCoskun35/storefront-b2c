using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Orders.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Orders.Core.Application.Commands;

public record RemoveCartItemCommand(
    string CartItemId,
    string? GuestId = null
) : IRequest<Result>;

public class RemoveCartItemCommandHandler : IRequestHandler<RemoveCartItemCommand, Result>
{
    private readonly OrdersDbContext _context;

    public RemoveCartItemCommandHandler(OrdersDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(RemoveCartItemCommand request, CancellationToken cancellationToken)
    {
        var cartItem = await _context.CartItems
            .Include(ci => ci.Cart)
            .FirstOrDefaultAsync(ci => ci.Id == request.CartItemId, cancellationToken);

        if (cartItem is null)
            return Error.NotFound("CartItem.NotFound", "Cart item not found");

        var cart = cartItem.Cart;

        // Verify ownership
        if (!string.IsNullOrEmpty(request.GuestId) && cart.GuestId != request.GuestId)
            return Error.Failure("Cart.Unauthorized", "Not authorized to modify this cart");

        _context.CartItems.Remove(cartItem);
        cart.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
