// 学习进度存储工具

const STORAGE_KEY = 'python-learning-progress';

/**
 * 获取学习进度
 * @returns {Object} 学习进度数据
 */
export const getProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('读取进度失败:', error);
  }
  
  // 默认进度数据
  return {
    completedChapters: [],  // 已完成的章节ID列表
    currentChapter: null,    // 当前学习的章节ID
    lastVisitTime: null,     // 最后访问时间
    chapterProgress: {},     // 各章节的详细进度
  };
};

/**
 * 保存学习进度
 * @param {Object} progress - 进度数据
 */
export const saveProgress = (progress) => {
  try {
    const data = {
      ...progress,
      lastVisitTime: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存进度失败:', error);
  }
};

/**
 * 标记章节为已完成
 * @param {string} chapterId - 章节ID
 */
export const markChapterCompleted = (chapterId) => {
  const progress = getProgress();
  if (!progress.completedChapters.includes(chapterId)) {
    progress.completedChapters.push(chapterId);
  }
  progress.currentChapter = chapterId;
  saveProgress(progress);
};

/**
 * 更新当前学习章节
 * @param {string} chapterId - 章节ID
 */
export const updateCurrentChapter = (chapterId) => {
  const progress = getProgress();
  progress.currentChapter = chapterId;
  saveProgress(progress);
};

/**
 * 检查章节是否已完成
 * @param {string} chapterId - 章节ID
 * @returns {boolean}
 */
export const isChapterCompleted = (chapterId) => {
  const progress = getProgress();
  return progress.completedChapters.includes(chapterId);
};

/**
 * 获取学习统计信息
 * @returns {Object} 统计信息
 */
export const getProgressStats = () => {
  const progress = getProgress();
  return {
    completedCount: progress.completedChapters.length,
    currentChapter: progress.currentChapter,
    lastVisitTime: progress.lastVisitTime,
  };
};

/**
 * 清除所有进度数据
 */
export const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清除进度失败:', error);
  }
};

/**
 * 获取下一个推荐学习的章节
 * @param {Array} allChapters - 所有章节列表
 * @returns {Object|null} 推荐的章节
 */
export const getNextRecommendedChapter = (allChapters) => {
  const progress = getProgress();
  
  // 如果有当前章节，返回下一个未完成的章节
  if (progress.currentChapter) {
    const currentIndex = allChapters.findIndex(ch => ch.id === progress.currentChapter);
    if (currentIndex !== -1 && currentIndex < allChapters.length - 1) {
      // 从当前章节往后找第一个未完成的
      for (let i = currentIndex + 1; i < allChapters.length; i++) {
        if (!progress.completedChapters.includes(allChapters[i].id)) {
          return allChapters[i];
        }
      }
    }
  }
  
  // 否则返回第一个未完成的章节
  return allChapters.find(ch => !progress.completedChapters.includes(ch.id)) || allChapters[0];
};
