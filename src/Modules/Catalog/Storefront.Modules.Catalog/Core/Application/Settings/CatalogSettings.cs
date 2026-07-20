namespace Storefront.Modules.Catalog.Core.Application.Settings;

/// <summary>
/// Configuration settings for the Catalog module
/// </summary>
public class CatalogSettings
{
    public const string SectionName = "CatalogSettings";

    /// <summary>
    /// Require price when creating/updating products.
    /// When false, products can be created without prices.
    /// Admin can still enter prices for internal tracking.
    /// </summary>
    public bool RequirePriceForProducts { get; set; } = false;
}
