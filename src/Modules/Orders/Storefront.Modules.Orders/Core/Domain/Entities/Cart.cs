namespace Storefront.Modules.Orders.Core.Domain.Entities;

public class Cart
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    // Guest Information
    public string? GuestId { get; set; }

    // Status
    public bool IsActive { get; set; } = true;

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public virtual ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
