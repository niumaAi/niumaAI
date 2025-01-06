const app = getApp()

Page({
  data: {
    hitCount: 0,
    maxCount: 0,
    resetClickCount: 0,
    resetClickTimer: null,
    isMinimized: false,
    isHitting: false,
    hitEffects: [],
    ripples: [],
    hitEffectId: 0,
    rippleId: 0,
    showWishForm: false,
    wishImage: '',
    wishContent: '',
    showBuddhaLight: false,
    nextResetTime: null,
    isClickable: true,  // 添加可点击状态控制
    hitTexts: [
      { text: '功德 +1', weight: 70 },
      { text: '功德 +2', weight: 15 },
      { text: '功德无量', weight: 5 },
      { text: '佛法无边', weight: 3 },
      { text: '心诚则灵', weight: 3 },
      { text: '善哉善哉', weight: 2 },
      { text: '阿弥陀佛', weight: 2 }
    ]
  },

  onLoad() {
    // 从本地存储加载数据
    const hitCount = wx.getStorageSync('hitCount') || 0
    const maxCount = wx.getStorageSync('maxCount') || 0
    this.setData({ hitCount, maxCount })
    
    // 创建音频上下文
    this.audioCtx = wx.createInnerAudioContext()
    this.audioCtx.src = '/static/audio/muyu.wav'  // 修改为正确的音频路径

    // 检查是否需要重置
    this.checkAndScheduleReset()
  },

  // 检查并设置重置定时器
  checkAndScheduleReset() {
    const now = new Date()
    const nextReset = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // 第二天
      0, 0, 0, 0 // 0点0分0秒
    )
    
    // 计算距离下次重置的毫秒数
    const timeUntilReset = nextReset.getTime() - now.getTime()
    
    // 设置定时器
    setTimeout(() => {
      this.resetCount()
      // 重置后继续设置下一个定时器
      this.checkAndScheduleReset()
    }, timeUntilReset)

    this.setData({
      nextResetTime: nextReset.getTime()
    })
  },

  // 重置功能
  resetCount() {
    this.setData({ 
      hitCount: 0,
      maxCount: 0 
    })
    wx.setStorageSync('hitCount', 0)
    wx.setStorageSync('maxCount', 0)
  },

  onWoodfishClick() {
    if (!this.data.isClickable) {
      return
    }

    const { hitCount } = this.data
    
    this.audioCtx.play()
    
    this.setData({
      hitCount: hitCount + 1,
      isHitting: true
    })

    this.showHitEffect()
    this.saveCount()
    
    setTimeout(() => {
      this.setData({ isHitting: false })
    }, 150)

    if ((this.data.hitCount) % 100 === 0) {
      this.setData({ isClickable: false })
      this.playEnhancedBuddhaLight()
    }
  },

  // 增强的佛光特效
  playEnhancedBuddhaLight() {
    this.setData({ showBuddhaLight: true })
    
    // 创建闪烁效果
    let flashCount = 0
    const flashInterval = setInterval(() => {
      this.setData({ 
        showBuddhaLight: flashCount % 2 === 0 
      })
      flashCount++
      
      if (flashCount >= 6) { // 闪烁3次
        clearInterval(flashInterval)
        this.setData({ 
          showBuddhaLight: false,
          showWishForm: true 
        })
      }
    }, 500) // 每500ms闪烁一次
  },

  showHitEffect() {
    const hitEffectId = this.data.hitEffectId + 1
    const rippleId = this.data.rippleId + 1
    
    // 获取随机文字
    const text = this.getRandomHitText()
    
    // 根据文字调整加分
    let addScore = 1
    if (text === '功德 +2') {
      addScore = 2
    } else if (text === '功德无量') {
      addScore = Math.floor(Math.random() * 5) + 3 // 随机加3-7功德
    }
    
    // 随机生成功德文字位置
    const angle = Math.random() * Math.PI * 2
    const distance = 30
    const effect = {
      id: hitEffectId,
      text,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance - 20,
      rotate: Math.random() * 30 - 15
    }

    const ripple = {
      id: rippleId
    }

    // 修改数组操作方式
    const newHitEffects = this.data.hitEffects.concat([effect])
    const newRipples = this.data.ripples.concat([ripple])

    this.setData({
      hitEffects: newHitEffects,
      ripples: newRipples,
      hitEffectId,
      rippleId,
      hitCount: this.data.hitCount + addScore - 1
    })

    // 移除特效
    setTimeout(() => {
      this.setData({
        hitEffects: this.data.hitEffects.filter(function(e) {
          return e.id !== effect.id
        }),
        ripples: this.data.ripples.filter(function(r) {
          return r.id !== ripple.id
        })
      })
    }, 1000)
  },

  saveCount() {
    const { hitCount, maxCount } = this.data
    const newMaxCount = Math.max(hitCount, maxCount)
    
    this.setData({ maxCount: newMaxCount })
    
    wx.setStorageSync('hitCount', hitCount)
    wx.setStorageSync('maxCount', newMaxCount)
  },

  onReset() {
    let { resetClickCount, resetClickTimer, maxCount } = this.data
    
    resetClickCount++
    
    if (resetClickTimer) {
      clearTimeout(resetClickTimer)
    }
    
    const timer = setTimeout(() => {
      this.setData({ resetClickCount: 0 })
    }, 1000)
    
    this.setData({
      resetClickCount,
      resetClickTimer: timer,
      hitCount: resetClickCount >= 3 ? maxCount : 0
    })
    
    this.saveCount()
  },

  onMinimize() {
    this.setData({ isMinimized: true })
  },

  onMaximize() {
    this.setData({ isMinimized: false })
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'], // 使用压缩图片
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          wishImage: res.tempFilePaths[0]
        })
      }
    })
  },

  submitWish() {
    if (!this.data.wishImage || !this.data.wishContent) {
      wx.showToast({
        title: '请填写完整愿望',
        icon: 'none'
      })
      return
    }

    // 显示许愿成功特效
    this.setData({
      showWishForm: false,
      isClickable: true  // 恢复可点击状态
    })

    wx.showToast({
      title: '愿望已送达佛祖',
      icon: 'success',
      duration: 2000
    })
  },

  inputWishContent(e) {
    this.setData({
      wishContent: e.detail.value
    })
  },

  closeWishForm() {
    this.setData({
      showWishForm: false,
      isClickable: true,  // 恢复木鱼可点击状态
      wishImage: '',      // 清空已选择的图片
      wishContent: ''     // 清空已输入的内容
    })
  },

  // 获取随机彩蛋文字
  getRandomHitText() {
    const hitTexts = this.data.hitTexts
    const totalWeight = hitTexts.reduce(function(sum, item) {
      return sum + item.weight
    }, 0)
    let random = Math.random() * totalWeight
    
    for (var i = 0; i < hitTexts.length; i++) {
      if (random < hitTexts[i].weight) {
        return hitTexts[i].text
      }
      random -= hitTexts[i].weight
    }
    
    return hitTexts[0].text
  }
})
