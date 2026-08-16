using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Storefront.SharedKernel.Web;

/// <summary>
/// Base class for controllers whose every action is restricted to admins.
/// Applies [ApiController] conventions and requires the "Admin" role for all
/// routes, so individual admin controllers don't repeat the attribute.
/// </summary>
[ApiController]
[Authorize(Roles = "Admin")]
public abstract class AdminControllerBase : ControllerBase
{
}
