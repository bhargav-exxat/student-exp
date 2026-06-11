declare module "react-payment-inputs" {
  import type * as React from "react"

  export type PaymentInputsReturn = {
    meta: { cardType?: string }
    getCardNumberProps: () => React.InputHTMLAttributes<HTMLInputElement>
    getExpiryDateProps: () => React.InputHTMLAttributes<HTMLInputElement>
    getCVCProps: () => React.InputHTMLAttributes<HTMLInputElement>
    getCardImageProps: (opts: { images: unknown }) => React.SVGProps<SVGSVGElement>
  }

  export function usePaymentInputs(): PaymentInputsReturn
}

declare module "react-payment-inputs/images" {
  export type CardImages = unknown
  const images: unknown
  export default images
}
