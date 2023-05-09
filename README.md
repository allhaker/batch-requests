# File Requests with Batching
Hello, dear reviewer!

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

First, as you can see I used the official `create-react-app` template with TypeScript. I think that this is a great starter template. For production use I'd have proabably ejected but for this purpose it worked just fine.

I had to do minimal setup for linter and tests. It pretty much worked out of the box.

Besides that I chose TypeScript. I have become quite accustomed to using TS over the last few years and I am convinced that in the long run TS saves time as it serves as an extra protection making sure that if the code builds then there is a higher likelyhood the app will actually work.

## Function Over Interceptor
The exercise text said the following: `Implement an interceptor that handles batching for the given API request. All requests should return the requested files.`

I first started exploring the interceptor idea. I am not super familiar with Axios. Google then led me here [LINK](https://github.com/calinortan/batch-request-interceptor/blob/master/src/interceptor.js).

This actually looks suspiciously like your exercise... Did you guys use it as inspiration or was this person doing an interview here?

So, yeah. I checked that code in the link. I think it's got quite a few problems. It's hard to read - it's well written but it's quite complicated. Besides it's going quite deep into internals of Axios and some things there like `HttpAdapter` are actually not types. I think Axios overall has somewhat poor types.

Right away then I thought that I want to use a more native approach with promises. I don't need to work all the adapters and know any internals.

Well, you can probably read the code. It's not the easiest to understand but basically it's quite simple.
1. On first request start the timer
2. Return promise back the caller so that we keep this event loop event hanging
3. Continue receive requests and returing promises
4. When timer is up then collect all params from all requests while removing duplicates
5. Make 1 actual requests with combined payload
6. When requests is done then filter out the results according to params and resolve right promises with right results
7. Reset batch requests collection and ready to start the cycle again

There is also an error scenario if request if finished with an error. Then just reject all promises.

This way you can use request files normally without batching or with batching anywhere you want. You can make one batch request client instance and share it via context.

Yes, this is a drawback that then you need to share it but it's very visible and does not involve any black magick which we all engineers love so much (sarcasm).

## How to test your code?

```
  npm run test
  // or
  npm start
  // and then check in the ui
```

## What are the challenges you faced? and how did you solve them?
The main challenge I have already discussed above regarding the choice of approach. It did take some time to get everything working right since it's not a very typical task but nothing major.

The other challenge was actually on the `App.tsx` side [here](https://github.com/allhaker/batch-requests/blob/exercise/src/App.tsx#L9).

The problem was that all the promises are resolved at the same time and when I write to `setFiles` the function `requestFile` does not recieve new files. This is because useCallback updates the function definition on `files` change but I am already running the previous version of the function which does not have new files.

So, I decided to add an off the scope variable in the render and just store data there. Dirty? Hell yeah. Works? Yes. Could have been solved by context where I could have accumulated values. But I decided against it since it would have been a significant extra amount of code.

Otherwise, I did not really have any major challenges. I can share that writing tests is boring so I have been playing with ChatGPT. I did have to fix quite a lot but overall I think it had sped me up.

## Give another good use case for batching requests and its benefits
What me implemented here is pretty much an example of Proxy pattern except I made it not completely oblivious to the client.

Any list or any situation where you are rendering some components in quantity and where these components individually send requests is a use case for this kinda batching (I'd actually rather call it squashing).

The main benefit is performance. Network requests are slow and having less requests makes frontend faster. Additonal benefit is the amount of load on the server. Less SQL queries, less open connections, less code execution - all that leads to lower loads on the backend as well.

## Running the App
### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
