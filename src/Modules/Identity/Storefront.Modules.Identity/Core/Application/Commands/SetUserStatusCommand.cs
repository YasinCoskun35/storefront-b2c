using MediatR;
using Storefront.SharedKernel;

namespace Storefront.Modules.Identity.Core.Application.Commands;

public sealed record SetUserStatusCommand(
    string UserId,
    bool IsActive
) : IRequest<Result<bool>>;
