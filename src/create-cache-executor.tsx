import React, { useEffect, useState } from 'react'
import { unmountComponentAtNode, render } from 'react-dom'

export type CacheExecutedComponentCloseMethod = (
  unmount?: boolean
) => void

export type CacheExecutedComponentProps<T extends object> = T & {
  close: CacheExecutedComponentCloseMethod
  visible: boolean
}

export type CacheComponentExecutor<T extends object> = (
  props: T,
  isRefresh?: boolean
) => CacheExecutedComponentCloseMethod

export function createCacheExecutor<T extends object = {}>(
  Component: React.ComponentType<CacheExecutedComponentProps<T>>,
  closeDelay?: number,
): CacheComponentExecutor<T> {
  let __dom__: HTMLDivElement | undefined
  let __props__: T
  let __timer__: any
  let __setVisible__: React.Dispatch<React.SetStateAction<boolean>> | undefined
  const cancelTimer = () => {
    if (__timer__) {
      clearTimeout(__timer__)
      __timer__ = undefined
    }
  }
  const distroy = () => {
    cancelTimer()
    if (__dom__) {
      unmountComponentAtNode(__dom__)
      if (__dom__.parentNode) {
        __dom__.parentNode.removeChild(__dom__)
      }
    }
    __dom__ = undefined
    __setVisible__ = undefined
  }
  const close = (unmount?: boolean, callback?: () => void) => {
    cancelTimer()
    if (__setVisible__) {
      __setVisible__(false)
      __setVisible__ = undefined
    }
    if (unmount) {
      const delay = closeDelay
      const call = () => {
        distroy()
        if (callback) {
          callback()
        }
      }
      if (delay) {
        __timer__ = setTimeout(call, delay)
      } else {
        call()
      }
    }
  }
  /** 渲染 */
  const Wrapper = () => {
    const [visible, setVisible] = useState<boolean>(false)
    __setVisible__ = setVisible
    useEffect(() => setVisible(true), [])
    return <Component {...__props__} close={close} visible={visible}/>
  }
  /** 创建并挂载 */
  const mount = () => {
    const call = () => {
      __dom__ = document.createElement('div')
      document.body.appendChild(__dom__)
      render(<Wrapper />, __dom__)
    }
    if (!__dom__) {
      call()
    } else {
      close(true, call)
    }
  }
  /** 返回调用 */
  return (props, isRefresh) => {
    cancelTimer()
    __props__ = props
    if (__dom__ && !isRefresh && __setVisible__) {
      __setVisible__(true)
    } else {
      mount()
    }
    return close
  }
}