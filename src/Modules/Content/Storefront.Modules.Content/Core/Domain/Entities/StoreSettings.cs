namespace Storefront.Modules.Content.Core.Domain.Entities;

/// <summary>
/// Singleton store configuration edited from the admin panel and read by the
/// storefront (contact details, WhatsApp, and homepage slider).
/// A single row is kept with the fixed id <see cref="DefaultId"/>.
/// </summary>
public class StoreSettings
{
    public const string DefaultId = "default";

    public string Id { get; set; } = DefaultId;

    // Store identity / contact
    public string StoreName { get; set; } = "Storefront";
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }

    // WhatsApp (number in international format without '+', e.g. 905551112233)
    public string? WhatsAppNumber { get; set; }
    public string? WhatsAppMessage { get; set; }

    // Socials
    public string? InstagramUrl { get; set; }
    public string? FacebookUrl { get; set; }

    // Branding
    public string? LogoUrl { get; set; }

    /// <summary>
    /// Homepage slider slides serialized as a JSON array. Kept as text so the
    /// slide shape can evolve without a schema change.
    /// </summary>
    public string SliderSlidesJson { get; set; } = "[]";

    public DateTime? UpdatedAt { get; set; }
}
