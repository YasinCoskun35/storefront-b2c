using Storefront.Modules.Orders.Core.Domain.Enums;

namespace Storefront.Modules.Orders.Core.Domain.Entities;

public class Order
{
    public string Id { get; set; } = Guid.NewGuid().ToString();

    public string OrderNumber { get; set; } = string.Empty; // e.g., "ORD-2024-0001"

    // Order type: QuoteRequest (B2B) or DirectPurchase (B2C)
    public OrderType OrderType { get; set; } = OrderType.DirectPurchase;

    // B2B Partner Information (nullable — only set for B2B orders)
    public string? PartnerCompanyId { get; set; }
    public string? PartnerUserId { get; set; }
    public string? PartnerCompanyName { get; set; }

    // B2C Guest Information (nullable — only set for B2C orders)
    public string? GuestEmail { get; set; }
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }

    // Status
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // Pricing
    public decimal? SubTotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? ShippingCost { get; set; }
    public decimal? Discount { get; set; }
    public decimal? TotalAmount { get; set; }
    public string? Currency { get; set; } = "TRY";

    // Delivery Information
    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;
    public string DeliveryState { get; set; } = string.Empty;
    public string DeliveryPostalCode { get; set; } = string.Empty;
    public string DeliveryCountry { get; set; } = string.Empty;
    public string? DeliveryNotes { get; set; }

    // Dates
    public DateTime? RequestedDeliveryDate { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public DateTime? ActualDeliveryDate { get; set; }

    // Additional Information
    public string? Notes { get; set; }
    public string? InternalNotes { get; set; }

    // Tracking
    public string? TrackingNumber { get; set; }
    public string? ShippingProvider { get; set; }

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Navigation Properties
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<OrderComment> Comments { get; set; } = new List<OrderComment>();
}
