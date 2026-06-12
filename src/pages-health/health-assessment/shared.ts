export function buildUser(userInfo: Record<string, any> = {}) {
  return {
    name: userInfo.nickName || userInfo.userName || userInfo.name || '未登录',
    gender: Number(userInfo.sex) === 2 ? '女' : '男',
    birthday: String(userInfo.birthday || '').split('T')[0],
  }
}

export function confirmAction(content: string, confirmText = '确认') {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '提示',
      content,
      cancelText: '取消',
      confirmText,
      success: result => resolve(result.confirm),
      fail: () => resolve(false),
    })
  })
}

export function showMessage(title: string) {
  uni.showToast({ title, icon: 'none' })
}
