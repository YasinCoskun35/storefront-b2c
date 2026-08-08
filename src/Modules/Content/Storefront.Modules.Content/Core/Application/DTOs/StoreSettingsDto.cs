namespace Storefront.Modules.Content.Core.Application.DTOs;

public sealed record SliderSlideDto(
    string ImageUrl,
    string? Headline,
    string? Subtext,
    string? CtaLabel,
    string? CtaLink
);

public sealed record StoreSettingsDto(
    string StoreName,
    string? ContactEmail,
    string? ContactPhone,
    string? Address,
    string? WhatsAppNumber,
    string? WhatsAppMessage,
    string? InstagramUrl,
    string? FacebookUrl,
    string? LogoUrl,
    IReadOnlyList<SliderSlideDto> Slides
);
