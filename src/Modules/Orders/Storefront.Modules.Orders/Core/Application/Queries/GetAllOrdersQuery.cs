using MediatR;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Orders.Core.Domain.Enums;
using Storefront.Modules.Orders.Infrastructure.Persistence;
using Storefront.SharedKernel;

namespace Storefront.Modules.Orders.Core.Application.Queries;

public record GetAllOrdersQuery(
    string? Status = null,
    string? GuestEmail = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<OrderSummaryDto>>>;

public record OrderSummaryDto(
    string Id,
    string OrderNumber,
    string? GuestEmail,
    string? GuestName,
    string Status,
    decimal? TotalAmount,
    string? Currency,
    int ItemCount,
    DateTime CreatedAt
);

public record PagedResult<T>(
    List<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);

public class GetAllOrdersQueryHandler : IRequestHandler<GetAllOrdersQuery, Result<PagedResult<OrderSummaryDto>>>
{
    private readonly OrdersDbContext _context;

    public GetAllOrdersQueryHandler(OrdersDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PagedResult<OrderSummaryDto>>> Handle(GetAllOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders.AsQueryable();

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<OrderStatus>(request.Status, true, out var status))
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrEmpty(request.GuestEmail))
            query = query.Where(o => o.GuestEmail != null && o.GuestEmail.Contains(request.GuestEmail));

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderSummaryDto(
                o.Id,
                o.OrderNumber,
                o.GuestEmail,
                o.GuestName,
                o.Status.ToString(),
                o.TotalAmount,
                o.Currency,
                o.Items.Count,
                o.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);

        return Result<PagedResult<OrderSummaryDto>>.Success(new PagedResult<OrderSummaryDto>(
            items, totalCount, request.PageNumber, request.PageSize, totalPages
        ));
    }
}
