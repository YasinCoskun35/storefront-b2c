using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Catalog.Core.Application.Commands;

public sealed record DeleteCategoryCommand(string Id) : IRequest<Result<bool>>;
