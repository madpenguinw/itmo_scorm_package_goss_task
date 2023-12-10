const slides = document.querySelector('.slides')
const MAX_SCORE = 100
const SLIDES_COUNT = 7
let USER_SESSION_SCORE_COUNTER = 0
let globalCurrentSlide = 1
let isAlertShown = false

function init() {
  const currentUserScore = Number(doLMSGetValue('cmi.core.score.raw'))
  if (currentUserScore !== 0) {
    doLMSSetValue('cmi.core.score.raw', 0)
  }
}

function slideController(iframeSlideSrc, slideIndex, isSlideWithTest) {
  slides.setAttribute('src', iframeSlideSrc)

  if (!isSlideWithTest) {
    const currentSlideScore = 2 ** (slideIndex - 1)
    USER_SESSION_SCORE_COUNTER = USER_SESSION_SCORE_COUNTER + currentSlideScore
    doLMSSetValue('cmi.core.score.raw', USER_SESSION_SCORE_COUNTER)
  }
}

function* slideIterator() {
  for (let index = 1; index <= SLIDES_COUNT; index++) {
    globalCurrentSlide = index
    yield slideController(`resources/slides/0${index}/index.html`, index, index === SLIDES_COUNT)
  }
}

doLMSInitialize()
init()

const iterator = slideIterator()
iterator.next()


window.addEventListener('message', e => {
  if (e.data.message === 'next') {
    return iterator.next()
  }

  const remainderAmount = MAX_SCORE - USER_SESSION_SCORE_COUNTER
  const successTestCoefficient = e.data.trueAnswers / e.data.questionsCount

  const testScore = remainderAmount * successTestCoefficient
  const finalScore = USER_SESSION_SCORE_COUNTER + testScore

  doLMSSetValue('cmi.core.score.raw', finalScore)
  
  if (finalScore >= 85) {
    doLMSSetValue('cmi.core.lesson_status', 'passed')
  }

  doLMSFinish()
  
  if (globalCurrentSlide === SLIDES_COUNT && !isAlertShown) {
    isAlertShown = true
    alert(`Complete! Your grade is ${finalScore}`)
  }
})