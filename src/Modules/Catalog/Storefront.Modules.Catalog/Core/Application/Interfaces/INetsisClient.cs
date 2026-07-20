using Storefront.Modules.Catalog.Core.Application.DTOs;

namespace Storefront.Modules.Catalog.Core.Application.Interfaces;

/// <summary>
/// Client for reading product and stock data from Netsis. Kept as an
/// interface so the transport (SOAP today, potentially REST/direct DB later)
/// can be swapped without touching the sync logic.
/// </summary>
public interface INetsisClient
{
    Task<IReadOnlyList<NetsisProductDto>> GetProductsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<NetsisStockLevelDto>> GetStockLevelsAsync(CancellationToken cancellationToken);
}
