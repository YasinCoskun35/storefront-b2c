using FluentValidation;
using Storefront.Modules.Catalog.Core.Application.Settings;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductCommandValidator(CatalogSettings settings)
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Product id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Product name is required.")
            .MaximumLength(500).WithMessage("Product name must not exceed 500 characters.");

        RuleFor(x => x.SKU)
            .NotEmpty().WithMessage("SKU is required.")
            .MaximumLength(100).WithMessage("SKU must not exceed 100 characters.");

        // Price is only mandatory when pricing is enabled for the store.
        When(x => settings.RequirePriceForProducts, () =>
        {
            RuleFor(x => x.Price)
                .NotNull().WithMessage("Price is required when pricing is enabled.")
                .GreaterThan(0).WithMessage("Price must be greater than zero.");
        });

        // Price must be positive if provided.
        When(x => x.Price.HasValue, () =>
        {
            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Price must be greater than zero.");
        });

        RuleFor(x => x.CompareAtPrice)
            .GreaterThan(x => x.Price).When(x => x.CompareAtPrice.HasValue && x.Price.HasValue)
            .WithMessage("Compare at price must be greater than the regular price.");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative.");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category is required.");

        RuleFor(x => x.Description)
            .MaximumLength(5000).When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Description must not exceed 5000 characters.");

        RuleFor(x => x.ShortDescription)
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.ShortDescription))
            .WithMessage("Short description must not exceed 500 characters.");
    }
}
