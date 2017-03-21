import 'es6-promise/auto'

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
// 客户端渲染或者服务端渲染都需要一个Vue实例
// 所以将这个Vue实例抽离出来以便共用
import { app, store } from './app'

// 客户端渲染的时候会将这个Vue实例装载到页面上
// 这时候需要在客户端上的全局变量中设置state的状态
store.replaceState(window.__INITIAL_STATE__)

app.$mount('#app')

// service worker
// if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//   navigator.serviceWorker.register('/service-worker.js')
// }
