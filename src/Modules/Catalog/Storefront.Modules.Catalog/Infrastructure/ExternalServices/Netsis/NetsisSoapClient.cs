using System.Globalization;
using System.Xml.Linq;
using Microsoft.Extensions.Logging;
using Storefront.Modules.Catalog.Core.Application.DTOs;
using Storefront.Modules.Catalog.Core.Application.Exceptions;
using Storefront.Modules.Catalog.Core.Application.Interfaces;
using Storefront.Modules.Catalog.Core.Application.Settings;

namespace Storefront.Modules.Catalog.Infrastructure.ExternalServices.Netsis;

/// <summary>
/// SOAP 1.1 client for the classic Netsis WebService. Response parsing matches
/// elements by local name only (ignoring namespaces/prefixes) because Netsis
/// typically returns DataSet-shaped XML whose exact wrapper varies by
/// version/install. Method and element names are configurable via
/// <see cref="NetsisSettings"/> to match the target WSDL.
/// </summary>
public sealed class NetsisSoapClient : INetsisClient
{
    private static readonly XNamespace SoapEnvelopeNs = "http://schemas.xmlsoap.org/soap/envelope/";
    private static readonly CultureInfo TurkishCulture = CultureInfo.GetCultureInfo("tr-TR");

    private readonly HttpClient _httpClient;
    private readonly NetsisSettings _settings;
    private readonly ILogger<NetsisSoapClient> _logger;

    public NetsisSoapClient(HttpClient httpClient, NetsisSettings settings, ILogger<NetsisSoapClient> logger)
    {
        _httpClient = httpClient;
        _settings = settings;
        _logger = logger;
    }

    public async Task<IReadOnlyList<NetsisProductDto>> GetProductsAsync(CancellationToken cancellationToken)
    {
        var response = await CallAsync(_settings.ProductListMethodName, BuildCredentialParameters(), cancellationToken);
        return ParseProducts(response);
    }

    public async Task<IReadOnlyList<NetsisStockLevelDto>> GetStockLevelsAsync(CancellationToken cancellationToken)
    {
        var parameters = BuildCredentialParameters();
        if (!string.IsNullOrWhiteSpace(_settings.WarehouseCode))
        {
            parameters["DepoKodu"] = _settings.WarehouseCode;
        }

        var response = await CallAsync(_settings.StockListMethodName, parameters, cancellationToken);
        return ParseStockLevels(response);
    }

    private Dictionary<string, string> BuildCredentialParameters() => new()
    {
        ["DBName"] = _settings.DbName,
        ["DBUser"] = _settings.DbUser,
        ["DBPassword"] = _settings.DbPassword,
        ["KullaniciKodu"] = _settings.Username,
        ["KullaniciSifre"] = _settings.Password,
        ["SubeKodu"] = _settings.BranchCode
    };

    private async Task<XDocument> CallAsync(
        string methodName,
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.ServiceUrl))
        {
            throw new NetsisIntegrationException("Netsis:ServiceUrl is not configured.");
        }

        var envelope = BuildEnvelope(methodName, _settings.SoapNamespace, parameters);

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.ServiceUrl)
        {
            Content = new StringContent(envelope, System.Text.Encoding.UTF8, "text/xml")
        };
        request.Headers.Add("SOAPAction", $"\"{_settings.SoapNamespace.TrimEnd('/')}/{methodName}\"");

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            throw new NetsisIntegrationException($"Failed to reach Netsis WebService at '{_settings.ServiceUrl}': {ex.Message}", ex);
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Netsis call '{Method}' returned {StatusCode}: {Body}", methodName, (int)response.StatusCode, body);
            throw new NetsisIntegrationException($"Netsis call '{methodName}' failed with status {(int)response.StatusCode}.");
        }

        try
        {
            return XDocument.Parse(body);
        }
        catch (System.Xml.XmlException ex)
        {
            throw new NetsisIntegrationException($"Netsis call '{methodName}' returned a response that could not be parsed as XML.", ex);
        }
    }

    private static string BuildEnvelope(string methodName, string ns, IReadOnlyDictionary<string, string> parameters)
    {
        XNamespace methodNs = ns;

        var methodElement = new XElement(
            methodNs + methodName,
            parameters.Select(p => new XElement(methodNs + p.Key, p.Value)));

        var envelope = new XDocument(
            new XDeclaration("1.0", "utf-8", null),
            new XElement(
                SoapEnvelopeNs + "Envelope",
                new XElement(SoapEnvelopeNs + "Body", methodElement)));

        return envelope.ToString(SaveOptions.DisableFormatting);
    }

    private List<NetsisProductDto> ParseProducts(XDocument document)
    {
        var results = new List<NetsisProductDto>();

        foreach (var row in FindRows(document, _settings.ProductRowElementName))
        {
            var stockCode = GetChildValue(row, "StokKodu", "StockCode");
            if (string.IsNullOrWhiteSpace(stockCode))
            {
                continue;
            }

            results.Add(new NetsisProductDto(
                StockCode: stockCode,
                Name: GetChildValue(row, "StokAdi", "StockName") ?? stockCode,
                Barcode: GetChildValue(row, "Barkod", "Barcode"),
                Unit: GetChildValue(row, "Birim", "Unit", "OlcuBirimi"),
                SalesPrice: ParseDecimal(GetChildValue(row, "SatisFiyati", "SalesPrice")),
                PurchasePrice: ParseDecimal(GetChildValue(row, "AlisFiyati", "PurchasePrice")),
                VatRate: ParseDecimal(GetChildValue(row, "KdvOrani", "VatRate")),
                CategoryCode: GetChildValue(row, "KategoriKodu", "GrupKodu", "CategoryCode"),
                BrandCode: GetChildValue(row, "MarkaKodu", "BrandCode"),
                OnHandQuantity: ParseDecimal(GetChildValue(row, "Miktar", "StokMiktar", "Quantity")) ?? 0m,
                IsActive: !IsTruthy(GetChildValue(row, "Pasif", "Inactive"))));
        }

        return results;
    }

    private List<NetsisStockLevelDto> ParseStockLevels(XDocument document)
    {
        var results = new List<NetsisStockLevelDto>();

        foreach (var row in FindRows(document, _settings.StockRowElementName))
        {
            var stockCode = GetChildValue(row, "StokKodu", "StockCode");
            if (string.IsNullOrWhiteSpace(stockCode))
            {
                continue;
            }

            results.Add(new NetsisStockLevelDto(
                StockCode: stockCode,
                WarehouseCode: GetChildValue(row, "DepoKodu", "WarehouseCode"),
                Quantity: ParseDecimal(GetChildValue(row, "Miktar", "StokMiktar", "Bakiye", "Quantity")) ?? 0m));
        }

        return results;
    }

    private static IEnumerable<XElement> FindRows(XDocument document, string rowElementName) =>
        document.Descendants().Where(e => string.Equals(e.Name.LocalName, rowElementName, StringComparison.OrdinalIgnoreCase));

    private static string? GetChildValue(XElement row, params string[] localNames)
    {
        foreach (var name in localNames)
        {
            var element = row.Elements().FirstOrDefault(e => string.Equals(e.Name.LocalName, name, StringComparison.OrdinalIgnoreCase));
            if (element is not null && !string.IsNullOrWhiteSpace(element.Value))
            {
                return element.Value;
            }
        }

        return null;
    }

    private static bool IsTruthy(string? value) =>
        value is "1" or "true" or "True";

    private static decimal? ParseDecimal(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var invariantResult))
        {
            return invariantResult;
        }

        return decimal.TryParse(value, NumberStyles.Any, TurkishCulture, out var turkishResult)
            ? turkishResult
            : null;
    }
}
