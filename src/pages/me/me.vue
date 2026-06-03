<template>
  <!-- <page-meta :root-font-size="`${this.$store.state.scaleFontSize}px`"></page-meta> -->
  <view
    class="h-screen w-screen overflow-hidden overflow-y-auto bg-gray-100"
  >
    <sar-status-bar class="!bg-[#fff]" />
    <sar-navbar />
    <view class="user-card p-4">
      <view class="flex items-center justify-between">
        <sar-avatar :src="userInfo.headPic" @click="handleAvatar" />
        <view class="ml-4 flex flex-1 flex-col" @click="handleAvatar">
          <view>{{ userInfo.name }}</view>
          <view class="mt-2">
            <sar-tag theme="primary" round plain>
              13112345678
            </sar-tag>
          </view>
        </view>
      </view>
    </view>
    <view class="p-4">
      <view class="prescription shadow-default mb-4">
        <view class="text-color-secondary text-30rpx font-bold">
          我的处方
        </view>
        <sar-button size="mini" round inline @click="handlePrescription">
          &emsp;查看&emsp;
        </sar-button>
      </view>
      <sar-card title="我的订单" class="shadow-default">
        <sar-grid>
          <sar-grid-item v-for="(item, index) in orderOptions" :key="item.name" @click="handleDrugOrder(index)">
            <view class="flex flex-col items-center justify-between">
              <image :src="item.img" mode="widthFix" class="h-40rpx w-40rpx" />
              <view class="mt-20rpx">
                {{ item.name }}
              </view>
            </view>
          </sar-grid-item>
        </sar-grid>
      </sar-card>
      <sar-card title="其他功能" class="shadow-default my-4">
        <sar-grid :columns="3">
          <sar-grid-item @click="handlePersonalInfo">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="gerenxinxi" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                个人信息
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handlePersonalIncome">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="shouyi" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                咨询订单
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handleHealthManagement">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="xiugaimima" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                健康管理
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handleHealthRecord">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="xitongtongzhi" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                健康档案
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handleTestReport">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="yijianfankui" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                检测报告
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handleDeliveryAddress">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="yijianfankui" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                配送地址
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handleFeedback">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="yijianfankui" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                意见反馈
              </view>
            </view>
          </sar-grid-item>
          <sar-grid-item @click="handlePulseDetection">
            <view class="flex flex-col items-center justify-between">
              <sar-icon family="vb-icons" name="yijianfankui" size="50rpx" color="#14b2ba" />
              <view class="mt-2 text-sm">
                脉象检测
              </view>
            </view>
          </sar-grid-item>
        </sar-grid>
      </sar-card>
    </view>
    <sar-dialog-agent />
  </view>
</template>

<script lang="ts" setup name="home">
import { dialog } from 'sard-uniapp'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
})
const assetsImg = [
  `${__ASSETS__}/index/dzf.png`,
  `${__ASSETS__}/index/dfh.png`,
  `${__ASSETS__}/index/dsh.png`,
  `${__ASSETS__}/index/qb.png`,
  `${__ASSETS__}/index/yijianfankui.png`,
]
const orderOptions = ref([
  {
    img: assetsImg[0],
    name: '待付款',
  },
  {
    img: assetsImg[1],
    name: '待发货',
  },
  {
    img: assetsImg[2],
    name: '待收货',
  },
  {
    img: assetsImg[3],
    name: '全部',
  },
])
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isLogin = computed(() => userStore.isLogin)
const resetPasswordRef = ref()
// 获取屏幕边界到安全区域距离
const { safeAreaInsets } = uni.getSystemInfoSync()
// 测试 uni API 自动引入
onLoad(() => {})
function handleAvatar() {
  if (!isLogin.value) {
    toLogin()
  }
  else {
    handlePersonalInfo()
  }
}
function loginDialog() {
  dialog.confirm({
    title: '提示',
    message: '当前未登录，是否登录？',
    buttonType: 'round',
    beforeClose: (type) => {
      if (type === 'confirm') {
        toLogin()
      }
    },
  })
}
function handleHealthManagement() {
  uni.navigateTo({
    url: '/pages-health/health-management/index',
  })
}
function handleHealthRecord() {
  uni.navigateTo({
    url: '/pages-health/health-record/index',
  })
}
function handlePulseDetection() {
  uni.navigateTo({
    url: '/pages-health/pulse/index',
  })
}
function handleTestReport() {
  uni.navigateTo({
    url: '/pages-health/test-report/index',
  })
}
function handleDeliveryAddress() {
  uni.navigateTo({
    url: '/pages-user/delivery-address/index',
  })
}

function handlePrescription() {
  uni.navigateTo({
    url: '/pages-sub/self-prescription/index',
  })
}
function handleDrugOrder() {
  uni.navigateTo({
    url: '/pages-cure/order/index',
  })
}
function handleNutritionOrder() {
  uni.navigateTo({
    url: '/pages-sub/nutrition-order/index',
  })
}
function handlePersonalInfo() {
  uni.navigateTo({
    url: '/pages-user/info/index',
  })
  // if (!isLogin.value) {
  //   loginDialog()
  // }
  // else {
  //   uni.navigateTo({
  //     url: '/pages-sub/personal-info/index',
  //   })
  // }
}
function handlePersonalIncome() {
  uni.navigateTo({
    url: '/pages-sub/personal-income/index',
  })
}
function handleChangePassword() {
  if (!isLogin.value) {
    loginDialog()
  }
  else {
    resetPasswordRef.value.open()
  }
}
function handleSystemNotice() {
  uni.navigateTo({
    url: '/pages-sub/system-notice/index',
  })
}
function handleFeedback() {
  uni.navigateTo({
    url: '/pages-user/feedback/index',
  })
}
function toLogin() {
  uni.navigateTo({
    url: '/pages/auth/login?redirect=/pages/me/me',
  })
}
function handleLogout() {
  console.log('🚀 ~ handleLogout ~ isLogin:', isLogin.value)
  console.log('🚀 ~ handleLogout ~ userInfo:', userInfo.value)
  if (!isLogin.value) {
    toLogin()
  }
  else {
    dialog.confirm({
      title: '提示',
      message: '确定退出登录吗？',
      buttonType: 'round',
      beforeClose: (type) => {
        if (type === 'confirm') {
          userStore.clearUserInfo()
          uni.navigateTo({
            url: '/pages/auth/login',
          })
        }
      },
    })
  }
}
</script>

<style scoped lang="scss">
.prescription {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 16rpx;
  background-image: linear-gradient(to right, #dab68f50, #dab68f20);
  border-radius: 16rpx;
}
.user-card {
  background-color: #fff;
  padding: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}
</style>
