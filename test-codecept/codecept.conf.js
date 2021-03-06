// exports.config = {
//   output: './output',
//   helpers: {
//     WebDriver: {
//       url: 'https://https://voluntarily.nz/',
//       browser: 'chrome',
//       host: '127.0.0.1',
//       port: 4444,
//       restart: false,
//       windowSize: '1920x1680',
//       desiredCapabilities: {
//         chromeOptions: {
//           args: [/* "--headless", */'--disable-gpu', '--window-size=1200,1000', '--no-sandbox']
//         }
//       }
//     },
//     REST: {
//       endpoint: 'http://site.com/api',
//       onRequest: (request) => {
//         request.headers.auth = '123'
//       }
//     }
//   },
//   include: {
//     I: './steps_file.js',
//     loginPage: './pages/LoginPage.js',
//     registrationPage: './pages/RegistrationPage.js'
//   },
//   mocha: {},
//   bootstrap: null,
//   teardown: null,
//   hooks: [],
//   gherkin: {
//     features: './features/*.feature',
//     steps: ['./step_definitions/steps.js']
//   },
//   plugins: {
//     screenshotOnFail: {
//       enabled: true
//     },
//     wdio: {
//       enabled: true,
//       services: ['selenium-standalone']
//     },
//     allure: {
//       enabled: true
//     }
//   },
//   tests: './*_test.js',
//   name: 'systemtest'
// }
