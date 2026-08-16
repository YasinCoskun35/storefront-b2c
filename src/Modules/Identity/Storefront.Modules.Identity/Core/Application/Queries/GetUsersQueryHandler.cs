using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Storefront.Modules.Identity.Core.Application.DTOs;
using Storefront.Modules.Identity.Core.Domain.Entities;
using Storefront.SharedKernel;

namespace Storefront.Modules.Identity.Core.Application.Queries;

public sealed class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<IReadOnlyList<UserDto>>>
{
    private readonly UserManager<ApplicationUser> _userManager;

    public GetUsersQueryHandler(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<Result<IReadOnlyList<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userManager.Users
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);

        var dtos = new List<UserDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            dtos.Add(new UserDto(
                Id: user.Id,
                Email: user.Email ?? string.Empty,
                FirstName: user.FirstName,
                LastName: user.LastName,
                IsActive: user.IsActive,
                Roles: roles.ToList()
            ));
        }

        return Result<IReadOnlyList<UserDto>>.Success(dtos);
    }
}
