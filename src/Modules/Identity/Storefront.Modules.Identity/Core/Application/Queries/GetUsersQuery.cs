using MediatR;
using Storefront.Modules.Identity.Core.Application.DTOs;
using Storefront.SharedKernel;

namespace Storefront.Modules.Identity.Core.Application.Queries;

public sealed record GetUsersQuery() : IRequest<Result<IReadOnlyList<UserDto>>>;
