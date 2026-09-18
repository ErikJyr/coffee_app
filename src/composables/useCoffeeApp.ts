import { onBeforeUnmount, onMounted, ref } from 'vue'
import { appAssets, appScreens, defaultProduct } from '@/data/coffee'
import type {
  AppScreen,
  CartLine,
  CoffeeProduct,
  DeliveryMode,
  PaymentMethod,
  ProductSize,
} from '@/types/coffee'

function isAppScreen(value: string): value is AppScreen {
  return appScreens.some((screen) => screen === value)
}

function getInitialScreen(): AppScreen {
  const hash = window.location.hash.slice(1)
  return isAppScreen(hash) ? hash : 'onboarding'
}

export function useCoffeeApp() {
  const screen = ref<AppScreen>(getInitialScreen())
  const selectedProduct = ref<CoffeeProduct>(defaultProduct)
  const selectedSize = ref<ProductSize>('M')
  const cartItems = ref<CartLine[]>([])

  const isFavorite = ref(false)
  const descriptionExpanded = ref(false)
  const deliveryMode = ref<DeliveryMode>('Deliver')
  const discountApplied = ref(true)
  const addressEditing = ref(false)
  const noteOpen = ref(false)
  const paymentOpen = ref(false)
  const paymentMethod = ref<PaymentMethod>('Wallet')
  const mapCentered = ref(false)

  function goTo(nextScreen: AppScreen) {
    screen.value = nextScreen
    window.location.hash = nextScreen
  }

  function openDetail(product: CoffeeProduct) {
    selectedProduct.value = {
      ...product,
      image: product.name === 'Caffe Mocha' ? appAssets.product : product.image,
    }
    selectedSize.value = 'M'
    goTo('detail')
  }

  function openOrder(items: CartLine[] = []) {
    cartItems.value = items.length
      ? items.map((item) => ({ ...item }))
      : [{ ...selectedProduct.value, quantity: 1 }]

    deliveryMode.value = 'Deliver'
    discountApplied.value = true
    paymentOpen.value = false
    goTo('order')
  }

  function changeLineQuantity(index: number, delta: number) {
    const item = cartItems.value[index]

    if (item) {
      item.quantity = Math.max(1, item.quantity + delta)
    }
  }

  function syncScreenWithHash() {
    screen.value = getInitialScreen()
  }

  onMounted(() => window.addEventListener('hashchange', syncScreenWithHash))
  onBeforeUnmount(() => window.removeEventListener('hashchange', syncScreenWithHash))

  return {
    screen,
    selectedProduct,
    selectedSize,
    cartItems,
    isFavorite,
    descriptionExpanded,
    deliveryMode,
    discountApplied,
    addressEditing,
    noteOpen,
    paymentOpen,
    paymentMethod,
    mapCentered,
    goTo,
    openDetail,
    openOrder,
    changeLineQuantity,
  }
}
