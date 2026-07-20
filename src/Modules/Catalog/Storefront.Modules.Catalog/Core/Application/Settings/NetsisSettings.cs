namespace Storefront.Modules.Catalog.Core.Application.Settings;

/// <summary>
/// Configuration for the Netsis ERP integration (product + stock sync).
/// Method/row element names are configurable because they vary between Netsis
/// WebService versions/installations - adjust them to match the target WSDL.
/// </summary>
public class NetsisSettings
{
    public const string SectionName = "Netsis";

    /// <summary>
    /// Master switch. When false, the scheduled sync does not run and manual
    /// sync requests are rejected. Keep false until connection details below
    /// are filled in with real values.
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Full URL of the Netsis SOAP WebService endpoint,
    /// e.g. http://netsis-server:8090/Netsis/WebService/DataService.asmx
    /// </summary>
    public string ServiceUrl { get; set; } = string.Empty;

    /// <summary>
    /// XML namespace used by the target WSDL for request/response elements.
    /// </summary>
    public string SoapNamespace { get; set; } = "http://tempuri.org/";

    public string DbName { get; set; } = string.Empty;
    public string DbUser { get; set; } = string.Empty;
    public string DbPassword { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string BranchCode { get; set; } = string.Empty;

    /// <summary>
    /// Netsis warehouse (depo) code to read stock levels from. Leave empty to
    /// request stock across all warehouses, if the endpoint supports that.
    /// </summary>
    public string? WarehouseCode { get; set; }

    public string ProductListMethodName { get; set; } = "StokKartListele";
    public string ProductRowElementName { get; set; } = "StokKart";
    public string StockListMethodName { get; set; } = "StokBakiyeListele";
    public string StockRowElementName { get; set; } = "StokBakiye";

    /// <summary>
    /// Category new (previously unseen) Netsis products are assigned to.
    /// Products for stock codes not already in the catalog are skipped until
    /// this is set to a valid Category Id.
    /// </summary>
    public string? DefaultCategoryId { get; set; }

    /// <summary>
    /// How often the background service runs a full sync.
    /// </summary>
    public int SyncIntervalMinutes { get; set; } = 60;

    public int RequestTimeoutSeconds { get; set; } = 100;
}
