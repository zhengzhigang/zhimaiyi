<template>
  <view class="m-20rpx">
    <view class="content">
      <view v-if="showTitle" class="pt-4 text-center text-32rpx font-bold">
        隐私协议
      </view>

      <view>
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          一、引言
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          我们非常重视您的隐私权和信息安全。作为一家致力于提供互联网医疗服务的公司，我们深知保护您的个人隐私和信息安全的重要性。本隐私保护政策将详细说明我们在收集、使用和保护您的个人信息方面的行为和措施。
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          二、定义与范围
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          本隐私保护政策适用于我们提供的所有互联网医疗软件和服务，包括但不限于在线咨询、远程诊断、健康管理等功能。我们将确保在收集、使用和保护您的个人信息时，遵守本隐私保护政策的规定。
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          三、信息收集与使用
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1、我们将仅在提供服务的过程中收集必要的个人信息，包括但不限于姓名、性别、年龄、联系方式、健康状况等。收集个人信息的目的仅为为您提供更优质的医疗服务。我们承诺不会向任何第三方出售、出租或交换您的个人信息，除非经过您的明确同意或法律要求。
          </view>
          <view>2、您有权查询、更正或删除您的个人信息。您可以通过我们的服务界面或联系客服进行操作。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          四、信息安全保护
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1、我们将采用合理的安全措施和技术手段保护您的个人信息，确保其不被未经授权的访问、泄露、损坏或丢失。
          </view>
          <view class="mb-12rpx">
            2、我们会对所有个人信息进行备份和加密处理，以防止信息泄露和损坏。
          </view>
          <view>3、如果发生个人信息泄露或安全事件，我们将立即采取应对措施，并及时通知您。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          五、用户权利与义务
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1、您有权了解我们的信息收集和使用行为，并可以随时拒绝或删除您的个人信息。
          </view>
          <view class="mb-12rpx">
            2、您应妥善保管个人信息，避免泄露或未经授权使用。
          </view>
          <view>3、如果您发现我们的行为违反了本隐私保护政策，或存在任何疑问或建议，请随时与我们联系。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          六、责任与处罚
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1、如果我们违反本隐私保护政策的规定或相关法律法规，导致您的信息泄露或遭受损失，我们将承担相应的法律责任。
          </view>
          <view class="mb-12rpx">
            2、对于违反本隐私保护政策的行为，我们将根据情节轻重采取相应的处罚措施，包括但不限于警告、冻结账户、终止服务等。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          七、其他条款
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1、本隐私保护政策将随着我们服务的变化而更新，更新后的政策将适用于所有用户。
          </view>
          <view class="mb-12rpx">
            2、本隐私保护政策的最终解释权归我们所有。如有任何疑问或建议，请随时与我们联系。
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps({
  showTitle: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped lang="scss">
</style>
