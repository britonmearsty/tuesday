import { createContext, useContext } from 'react'
import { useParams as useReactRouterParams } from 'react-router-dom'

export const RouteParamsContext = createContext<Record<string, string | undefined> | null>(null)

export function useParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>
>(): T {
  const customParams = useContext(RouteParamsContext)
  const routerParams = useReactRouterParams<T>()
  if (customParams) {
    return customParams as T
  }
  return routerParams as T
}
