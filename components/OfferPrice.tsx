"use client";

import {
  comparablePriceBrl,
  conversionHint,
  formatMoney,
  hasValidBrlConversion,
  isBrlCurrency,
  rawOfferPrice,
  type OfferMoneyFields,
} from "@/utils/money";

export type OfferPriceProps = {
  offer: OfferMoneyFields;
  /** Quando true, exibe o badge “Menor preço” na linha principal. */
  isBest?: boolean;
  showPixLabel?: boolean;
  showPromoLabel?: boolean;
  nowMs?: number;
};

/**
 * Hierarquia visual de preço:
 * - BRL: valor local (sem linha duplicada de conversão)
 * - Estrangeiro com conversão: BRL principal + original secundário
 * - Estrangeiro sem conversão: original + “Conversão indisponível”
 */
export default function OfferPrice({
  offer,
  isBest = false,
  showPixLabel = false,
  showPromoLabel = false,
  nowMs,
}: OfferPriceProps) {
  const currency = offer.currency || "BRL";
  const localPrice = rawOfferPrice(offer);
  const brlComparable = comparablePriceBrl(offer);
  const foreign = !isBrlCurrency(currency);
  const converted = foreign && hasValidBrlConversion(offer);
  const hint = conversionHint(offer, nowMs);
  const status = (offer.exchange_rate_status || "").toLowerCase();
  const primaryTitle =
    converted && status === "stale"
      ? "Valor convertido em BRL (cotação aproximada — não é custo final)"
      : converted
        ? "Valor convertido em BRL (somente câmbio — não é custo final)"
        : undefined;

  return (
    <div className="offer-price">
      <div className="persisted-offer-price-line">
        {isBest && brlComparable != null ? (
          <span className="persisted-offer-best">Menor preço</span>
        ) : null}
        {converted ? (
          <>
            <strong title={primaryTitle}>{formatMoney(offer.converted_price_brl, "BRL")}</strong>
            {status === "stale" ? <span title={hint ?? undefined}>aprox.</span> : null}
          </>
        ) : (
          <>
            <strong>{formatMoney(localPrice, currency)}</strong>
            {!foreign && showPixLabel ? <span>à vista no Pix</span> : null}
            {!foreign && showPromoLabel ? <span>promoção temporária</span> : null}
          </>
        )}
      </div>
      {converted ? (
        <div className="offer-price-original">
          <span>{formatMoney(localPrice, currency)}</span>
          {hint ? <span className="offer-price-fx-meta"> · {hint}</span> : null}
        </div>
      ) : null}
      {foreign && !converted ? (
        <div className="offer-price-original offer-price-unavailable">
          <span>Conversão indisponível</span>
        </div>
      ) : null}
    </div>
  );
}
