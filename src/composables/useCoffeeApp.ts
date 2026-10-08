import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { addCartProduct } from '@/data/cart'
import { appAssets, appScreens, defaultProduct, getPriceForSize } from '@/data/coffee'
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

  const favoriteNames = ref<string[]>([])
  const isFavorite = computed<boolean>({
    get: () => favoriteNames.value.includes(selectedProduct.value.name),
    set: (favorite) => {
      favoriteNames.value = favorite
        ? [...favoriteNames.value.filter((name) => name !== selectedProduct.value.name), selectedProduct.value.name]
        : favoriteNames.value.filter((name) => name !== selectedProduct.value.name)
    },
  })
  const orderOrigin = ref<AppScreen>('home')
  const deliveryAddress = ref<string>('Kohtu tn 22, Kuressaare, 93812, Estonia')
  const deliveryNote = ref<string>('')
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
    window.scrollTo(0, 0)
  }

  function openDetail(product: CoffeeProduct) {
    selectedProduct.value = {
      ...product,
      image: product.name === 'Caffe Mocha' ? appAssets.product : product.image,
    }
    selectedSize.value = 'M'
    descriptionExpanded.value = false
    goTo('detail')
  }

  function addProduct(product: CoffeeProduct): void {
    cartItems.value = addCartProduct(cartItems.value, product, 'M')
  }

  function buyProduct(): void {
    const product = {
      ...selectedProduct.value,
      price: getPriceForSize(selectedProduct.value.price, selectedSize.value),
    }
    cartItems.value = addCartProduct(cartItems.value, product, selectedSize.value)
    orderOrigin.value = 'detail'
    goTo('order')
  }

  function openCart(): void {
    orderOrigin.value = 'home'
    goTo('order')
  }

  function backFromOrder(): void {
    goTo(orderOrigin.value)
  }

  function changeLineQuantity(index: number, delta: number): void {
    if (!cartItems.value[index]) throw new RangeError(`Basket item ${index} does not exist`)
    cartItems.value = cartItems.value
      .map((item, itemIndex) => itemIndex === index ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0)
  }

  function syncScreenWithHash() {
    screen.value = getInitialScreen()
    window.scrollTo(0, 0)
  }

  onMounted(() => window.addEventListener('hashchange', syncScreenWithHash))
  onBeforeUnmount(() => window.removeEventListener('hashchange', syncScreenWithHash))

  return {
    screen,
    selectedProduct,
    selectedSize,
    cartItems,
    favoriteNames,
    deliveryAddress,
    deliveryNote,
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
    addProduct,
    buyProduct,
    openCart,
    backFromOrder,
    changeLineQuantity,
  }
}
