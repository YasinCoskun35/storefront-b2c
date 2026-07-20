namespace Storefront.Modules.Catalog.Core.Application.DTOs;

/// <summary>
/// A product record as returned by the Netsis product list call (e.g. StokKartListele).
/// </summary>
public sealed record NetsisProductDto(
    string StockCode,
    string Name,
    string? Barcode,
    string? Unit,
    decimal? SalesPrice,
    decimal? PurchasePrice,
    decimal? VatRate,
    string? CategoryCode,
    string? BrandCode,
    decimal OnHandQuantity,
    bool IsActive
);

/// <summary>
/// A stock balance record as returned by the Netsis stock list call (e.g. StokBakiyeListele).
/// </summary>
public sealed record NetsisStockLevelDto(
    string StockCode,
    string? WarehouseCode,
    decimal Quantity
);

/// <summary>
/// Outcome of a full products + stock sync run.
/// </summary>
public sealed record NetsisSyncResultDto(
    int ProductsFetched,
    int ProductsCreated,
    int ProductsUpdated,
    int ProductsSkipped,
    int StockLevelsUpdated,
    DateTime SyncedAtUtc
);
