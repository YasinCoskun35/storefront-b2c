using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

// ImageIds lists one representative image id per photo, in the desired
// display order (the id the admin UI already shows for that gallery tile).
public sealed record ReorderProductImagesCommand(string ProductId, IReadOnlyList<string> ImageIds) : IRequest<Result<bool>>;
