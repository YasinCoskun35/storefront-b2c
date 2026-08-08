using System.Text.Json;
using Storefront.Modules.Content.Core.Domain.Entities;

namespace Storefront.Modules.Content.Core.Application.DTOs;

/// <summary>
/// Maps between the <see cref="StoreSettings"/> entity (which stores slides as a
/// JSON string) and the API <see cref="StoreSettingsDto"/>.
/// </summary>
public static class StoreSettingsMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IReadOnlyList<SliderSlideDto> DeserializeSlides(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<SliderSlideDto>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    public static string SerializeSlides(IEnumerable<SliderSlideDto>? slides)
        => JsonSerializer.Serialize(slides ?? [], JsonOptions);

    public static StoreSettingsDto ToDto(StoreSettings settings) => new(
        settings.StoreName,
        settings.ContactEmail,
        settings.ContactPhone,
        settings.Address,
        settings.WhatsAppNumber,
        settings.WhatsAppMessage,
        settings.InstagramUrl,
        settings.FacebookUrl,
        settings.LogoUrl,
        DeserializeSlides(settings.SliderSlidesJson)
    );
}
