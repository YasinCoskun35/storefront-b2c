# Netsis Integration

## Overview

Pulls product master data and stock levels from Netsis ERP and syncs them
into the Catalog module (`catalog.Products`). Built as part of the Catalog
module (not a separate module) because it writes directly into
`CatalogDbContext`, and the architecture forbids modules referencing each
other.

Two ways to run a sync:
- **Scheduled** — `NetsisSyncBackgroundService` runs automatically on an
  interval.
- **Manual** — `POST /api/admin/netsis/sync` (Admin role required).

Both paths funnel through the same `SyncNetsisProductsCommand`, so behavior
is identical either way.

---

## Transport

Implemented against the classic Netsis **SOAP WebService**
(`INetsisClient` / `NetsisSoapClient`). Netsis WebService installs vary in
their exact method names and response shape, so those are configurable
rather than hardcoded — see `NetsisSettings`. Response XML is parsed by
matching element **local names**, ignoring namespaces/prefixes, since Netsis
typically returns DataSet-shaped XML whose wrapper differs by version.

If your Netsis instance instead exposes a REST API or you only have direct
SQL Server access, implement `INetsisClient` with a different class and
swap the registration in `CatalogModuleExtensions.AddCatalogModule`
(`services.AddHttpClient<INetsisClient, NetsisSoapClient>(...)`) — nothing
else needs to change.

---

## Configuration (`appsettings.json` → `Netsis`)

```json
{
  "Netsis": {
    "Enabled": false,
    "ServiceUrl": "http://netsis-server:8090/Netsis/WebService/DataService.asmx",
    "SoapNamespace": "http://tempuri.org/",
    "DbName": "",
    "DbUser": "",
    "DbPassword": "",
    "Username": "",
    "Password": "",
    "BranchCode": "",
    "WarehouseCode": "",
    "ProductListMethodName": "StokKartListele",
    "ProductRowElementName": "StokKart",
    "StockListMethodName": "StokBakiyeListele",
    "StockRowElementName": "StokBakiye",
    "DefaultCategoryId": null,
    "SyncIntervalMinutes": 60,
    "RequestTimeoutSeconds": 100
  }
}
```

**Before enabling:**

1. `Enabled` — stays `false` (sync is a no-op) until everything below is filled in.
2. `ServiceUrl` / `SoapNamespace` — get these from your Netsis WSDL.
3. `DbName`, `DbUser`, `DbPassword`, `Username`, `Password`, `BranchCode`,
   `WarehouseCode` — Netsis connection credentials.
4. `ProductListMethodName` / `ProductRowElementName` and
   `StockListMethodName` / `StockRowElementName` — match your WSDL's actual
   operation and row element names if they differ from the Netsis defaults
   assumed here.
5. `DefaultCategoryId` — a real `Category.Id`. New Netsis products (SKUs not
   already in the catalog) are **skipped** and logged as a warning until
   this is set, since Catalog products require a category.

Secrets (`DbPassword`, `Password`) should go through environment
variable / secrets-manager overrides in production, same as `Jwt:Secret`
and the Iyzico keys — don't commit real values to `appsettings.json`.

---

## Sync Behavior

For each Netsis product (matched by `SKU` == Netsis `StokKodu`):

- **Existing SKU** → updates `Name`, `Price`, `Cost`, `Quantity`,
  `StockStatus`, `IsActive`.
- **New SKU** → creates a `Simple` product under `DefaultCategoryId`, or is
  skipped if that setting isn't configured.
- **Stock levels** are fetched in a second call and applied on top
  (summed across warehouses if a product appears in more than one), so a
  stock-only refresh still runs even if nothing else changed.

`StockStatus` is derived from quantity: `OutOfStock` at ≤0, `LowStock` if
at or below the product's `LowStockThreshold`, otherwise `InStock`.

Product fetch and stock fetch fail independently — if stock fetch fails
after products already synced, the product sync is still committed and the
failure is only logged.

---

## Files

- `Core/Application/Settings/NetsisSettings.cs`
- `Core/Application/DTOs/NetsisDtos.cs`
- `Core/Application/Interfaces/INetsisClient.cs`
- `Core/Application/Exceptions/NetsisIntegrationException.cs`
- `Core/Application/Commands/SyncNetsisProductsCommand(Handler).cs`
- `Infrastructure/ExternalServices/Netsis/NetsisSoapClient.cs`
- `Infrastructure/BackgroundJobs/NetsisSyncBackgroundService.cs`
- `API/Controllers/NetsisController.cs`
