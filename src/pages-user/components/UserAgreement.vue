<template>
  <view class="m-20rpx">
    <view class="content">
      <view v-if="showTitle" class="pt-4 text-center text-[1rem] font-bold">
        用户协议
      </view>
      <view class="mt-30rpx">
        <view class="mt-20rpx indent-2em text-30rpx">
          <view>尊敬的用户：</view>
          <view>欢迎使用本平台服务！</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          协议说明
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          本协议是您与本平台之间关于使用本平台服务所订立的协议。
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          审慎阅读
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          您在申请注册流程中点击同意本协议之前，应当认真阅读本协议。请您务必审慎阅读、充分理解条款内容，特别是免除或者限制责任的条款、法律适用和争议解决条款。如您对协议有任何疑问可向本平台客服咨询。如您未满18周岁，或以其他形式被限制民事行为能力，请在监护人的陪同下阅读本协议。
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          签约动作
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          您按照注册页面提示填写信息、阅读并同意本协议一旦完成全部注册程序后即表示您己经充分阅读、理解并接受本协议的全部内容，并与本平台达成一致，成为本平台的在线平台用户。您的注册行为将被认为是对本协议全部条款无保留的接受和遵守。阅读本协议的过程中如果您不同意本协议或其中任何条款约定您应立即停止注册程序。
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          词汇定义
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view>本平台：指包括本平台的在线移动客户端及其他现在或将来推出的基于本平台的在线服务平台。</view>
          <view class="mt-12rpx">
            用户：指阅读并同意本协议内容且经过本平台在线注册程序成为本平台各项服务使用者的个人。
          </view>
          <view class="mt-12rpx">
            本平台管理规定：指包括本协议在内的，由用户签署，或由本平台在明显位置展示的具有规范用户行为作用的各类规定、提示、声明文件。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          一、用户及注册
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            1.1 本平台提供用户注册，使用微信号和手机号均唯一的方式来确认账号归属，您应当对以您的账号进行的所有活动和事件负法律责任。
          </view>
          <view>1.2 本平台注册时，在账号名称、头像等注册信息中不得出现违法和不良信息，否则本平台有权拒绝提供服务，并关闭该账号。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          二、服务内容
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            2.1 本平台的具体内容由本平台在线经营者提供，本平台经营者保留随时变更、中断或终止部分或全部网络服务的权利。
          </view>
          <view class="mb-12rpx">
            2.2 本平台作为医患交流互通平台，您通过本平台发表的各种言论（包括但不仅限于咨询问题、就医经验、问题反馈等），并不代表本平台赞同您的观点或证实其内容的真实性。
          </view>
          <view class="mb-12rpx">
            2.3 您在本平台上获得的医生答复、医学文章、医疗保健信息、健康咨询建议等均不代表本平台utterstock或证实内容的真实性，以上信息不能作为您采用治疗方案的直接依据。如确有必要，您应当及时去线下医疗机构进行面对面的诊疗。
          </view>
          <view class="mb-12rpx">
            2.4 本平台在提供网络服务时，可能会对部分服务收取一定费用，本平台将会对收费服务给予明确的提示，如您拒绝支付此类费用，本平台有权不提供相关服务；您同意并认可本平台现行的服务价格标准，您最终支付的费用由您所购买服务的类型决定。
          </view>
          <view class="mb-12rpx">
            2.5 本平台仅提供相关的服务，除此之外与服务有关的设备（如电脑、调制解调器及真他与接入互联网有关的装置）及所需的费用（如为接入互联网而支付的电话费及上网费）均应由您自行负担。
          </view>
          <view>2.6 因不可抗力、网络状况、通讯线路、用户自身过错等技术原因，或其他不可控原因导致您不能正常使用本平台在线服务，本平台不承担相应责任。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          三、用户的权利和责任
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            3.1 您不得以任何形式转让或授权他人使用自己在本平台的账号，亦不得盗用他人账号，由以上行为造成的后果由用户自行承担。
          </view>
          <view class="mb-12rpx">
            3.2 用户有权根据本平台管理规定发布、获取信息，进行医患互通交流等。
          </view>
          <view class="mb-12rpx">
            3.3 您必须遵守有关卫生健康相关法律法规及国家关于互联网信息发布的相关法律法规，您对自己在本平台上发布的信息承担责任，您不得发布违法信息，不得恶意评价真他用户。您承诺自己在使用本平台时实施的所有行为均遵守国家法律、法规和本平台管理规定以及社会公共利益或公共道德。如您违反上述任一规则，导致相应法律后果的发生，您将以自己的名义独立承担所有法律责任。
          </view>
          <view class="mb-12rpx">
            3.4 您不得将涉及医疗纠纷的问题或其它有责任争议的问题在本平台发布，关于医疗纠纷的问题，请另行咨询律师或相关主管部门寻求援助，本平台有权将此类信息删除。
          </view>
          <view class="mb-12rpx">
            3.5 您发现其他用户有违法或违反本平台管理规定的行为，可以向本平台进行反映要求处理。您因本平台展示的内容与其他用户发生纠纷的，司法部门可以要求本平台根据法律程序提供该案件所需证据材料。
          </view>
          <view>3.6 未经本平台授权，您不得将本平台展示的内容直接或变相用于商业目的包括但不限于将平台数据用于任何模型训练的输入，或将训练后的模型用于商业目的等。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          四、本平台的权利和责任
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            4.1 本平台将协助医患之间进行合法的交流，并提供必要的网络技术帮助
          </view>
          <view class="mb-12rpx">
            4.2 本平台有义务在现有技术上维护整个网络平台的正常运行，并努力提升和改进技术，使医患网上交流、互助得以顺利进行
          </view>
          <view class="mb-12rpx">
            4.3 本平台作为医患互通服务的平台，不对您发布的信息的来源和正确性负责，不参与医患交流，不对医患交流的结果承担任何责任
          </view>
          <view class="mb-12rpx">
            4.4 对于您在本平台上的不当行为或其它任何本平台认为应当终止服务的情况本平台有权随时作出删除相关信息、终止服务提供等处理，而无需征得您的同意
          </view>
          <view class="mb-12rpx">
            4.5 本平台没有义务对所有用户的注册数据、所有的活动行为以及与之有关的其它事项进行审查，但如存在下列情况，本平台有权根据不同情况选择保留或删除相关信息或继续、停止对该用户提供服务并追究相关法律责任：
          </view>
          <view class="mb-12rpx">
            ①您或其它第三方通知本平台，认为某个具体用户、具体行为、具体事项可能存在重大问题
          </view>
          <view class="mb-12rpx">
            ②您或其它第三方向本平台告知网络平台上有违法或不当行为的，本平台以普通非专业医疗人员的知识水平标准对相关内容进行判别，可以明显认为这些内容或行为具有违法或不当性质的。
          </view>
          <view class="mb-12rpx">
            4.6 用户在本平台上如与其他用户产生纠纷，请求本平台从中予以调处，经本平台审核后，本平台有权向纠纷双方了解情况，并将所了解的情况互相通知对方；本平台所作出的调处行为不具有法律效力，调处结果系由纠纷双方自愿作出，本平台仅协助提供信息的沟通，不对调处结果承担相应法律责任。
          </view>
          <view class="mb-12rpx">
            4.7 本平台有权对用户的注册数据及活动行为进行查阅，发现注册数据或活动行为中存在任何问题或怀疑，均有权向用户发出询问及要求改正的通知或者直接作出删除等处理
          </view>
          <view class="mb-12rpx">
            4.8 经国家生效法律文书或行政处罚决定确认用户存在违法行为，或者本平台有足够事实依据可以认定用户存在违法或违反本平台管理规定的行为的，本平台有权以合理方式公布用户的违法行为
          </view>
          <view>4.9 因不可抗力（如火灾、水灾、暴动、骚乱、战争、自然灾害等）导致本平台的服务中断或者用户数据损坏、丢失等，本平台不承担任何责任</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          五、服务变更、中断或终止
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            5.1 因系统维护或升级的需要而需暂停网络服务，本平台将尽可能事先进行通告。
          </view>
          <view class="mb-12rpx">
            5.2 如发生下列任何一种情形，本平台有权解除本协议，并终止您的全部服务：
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.1 您违反国家有关法律法规或本平台管理规定，侵害他人合法权益的；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.2 您因在本平台上的不当行为被行政或司法机构拘留或起诉；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.3 您丧失使用网站服务的行为能力；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.4 您提供的个人资料不真实；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.5 您盗用他人账户、发布违禁信息、骗取他人财物的；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.6 您传播虚假信息，歪曲事实，经查证属实的；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.2.7 其它本平台认为需要终止服务的情况。除前款所述情形外，本平台保留在不事先通知您的情况下，随时中断或终止部分或全部网络服务的权利，对于服务的中断或终止而造成您的损失的本平台不承担任何责任。
          </view>
          <view class="mb-12rpx">
            5.3 服务发生变更、中断、终止后，本平台仍有以下权利：
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.3.1 服务发生终止后，本平台将您的注册数据及以前的行为记录进行匿名化处理；
          </view>
          <view class="mb-12rpx pl-12rpx">
            5.3.2 如您在服务变更、中断、终止前，在本平台上存在违法行为或违反条款的行为，本平台仍可行使本服务条款所规定的权利。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          六、个人隐私
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          尊重用户个人隐私信息的私有性是本平台的一贯原则，本平台将通过技术手段、强化内部管理等办法充分保护用户的个人隐私信息除法律或高法律赋予权限的政府部门要求或事先得到用户明确授权等原因外本平台保证不对外公开或向第三方透露您的个人隐私信息或用户在使用服务时存储的非公开内容。同时为了运营和改善本平台的技术与服务，本平台将可能会自行收集使用或向第三方提供用户的非个人隐私信息，这将有助于本平台向用户提供更好的用户体验和服务质量。
          <view class="mt-12rpx">
            您使用或继续使用我们的服务即意昧着同意我们收集、使用、储存和分享您的相关信息。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          七、免责声明
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            7.1 本平台不承诺网络服务一定能满足您的要求，也不承诺网络服务不会中断对网络服务的及时性、安全性、准确性也都不作承诺。
          </view>
          <view class="mb-12rpx">
            7.2 本平台不承诺网页上设置的外部链接的准确性和完整性，同时，对于该等外部链接指向的不由本平台实际控制的任何网页上的内容本平台不承担任何责任。
          </view>
          <view class="mb-12rpx">
            7.3 对于因不可抗力或本平台不能控制的原因造成的网络服务中断或其它缺陷，本平台不承担任何责任，但将尽力减因此而给您造成的损失和影响。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          八、违约赔偿
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            8.1 您同意保障和维护本平台及其他用户的利益，如因您违反有关法律、法规或本平台管理规定而给本平台或任何其它第三人造成损失，您同意承担由此造成的损害赔偿责任。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          九、服务条款修改
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            9.1 本平台有权根据服务情况变更、终止本平台管理规定的各项条款，本平台在线将会通过适当方式向您提示修改内容。
          </view>
          <view>9.2 如果您不同意本平台管理规定所做的修改，有权停止使用网络服务。如果您继续使用网络服务，则视为您接受本平台对服务协议相关条款所做的修改。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          十、法律管辖
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            10.1 本服务协议的订立、执行和解释及争议的解决均应适用中国法律。
          </view>
          <view class="mb-12rpx">
            10.2 如双方就本服务协议内容或真执行发生任何争议，双方应尽量友好协商解决，协商不成时，任何一方均可向本平台经营者所在地的人民法院提起诉讼。
          </view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          十一、通知送达
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            11.1 本协议项下本平台对于您所有的通知均可通过网页公告、电子邮件、手机短信或常规的信件传送等方式进行；通知于发送之日视为己送达给您。
          </view>
          <view>11.2 您对于本平台在线的通知应当通过本平台对外正式公布的通信地址、传真号码、电子邮件地址等联系信息进行送达。</view>
        </view>
      </view>

      <view class="mt-30rpx">
        <sar-tag theme="primary" mark="right" class="!p-10rpx !text-32rpx">
          十二、其他规定
        </sar-tag>
        <view class="mt-20rpx indent-2em">
          <view class="mb-12rpx">
            12.1 本服务协议构成您与本平台在线服务之约定事顶及其它有关事宜的完整协议，除服务条款规定的之外，未赋予服务条款各方其他权利。
          </view>
          <view class="mb-12rpx">
            12.2 如本服务协议中的任何条款无论因何种原因完全或部分无效或不具有执行力，本协议的其余条款仍应有效并且有约束力。
          </view>
          <view>12.3 本服务协议中的标题仅为方便而设，在解释时应被忽略。</view>
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
