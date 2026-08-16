using MediatR;
using Microsoft.AspNetCore.Identity;
using Storefront.Modules.Identity.Core.Domain.Entities;
using Storefront.SharedKernel;

namespace Storefront.Modules.Identity.Core.Application.Commands;

public sealed class SetUserStatusCommandHandler : IRequestHandler<SetUserStatusCommand, Result<bool>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public SetUserStatusCommandHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<bool>> Handle(SetUserStatusCommand request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user is null)
        {
            return Result<bool>.Failure(Error.NotFound("User.NotFound", "User not found."));
        }

        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return Result<bool>.Failure(Error.Validation("User.UpdateFailed", errors));
        }

        return Result<bool>.Success(true);
    }
}
