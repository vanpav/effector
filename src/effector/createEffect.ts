import {step} from './typedef'
import {getGraph, getParent} from './getter'
import {own} from './own'
import {createNode} from './createNode'
import {launch} from './kernel'
import {createNamedEvent, createStore, createEvent} from './createUnit'
import {createDefer} from './defer'
import {isObject, isFunction} from './is'
import {throwError} from './throw'

export function createEffect<Payload, Done>(
  nameOrConfig: any,
  maybeConfig: any,
) {
  const instance: any = createEvent(nameOrConfig, maybeConfig)
  let handler =
    instance.defaultConfig.handler ||
    (() => throwError(`no handler used in ${instance.getType()}`))

  getGraph(instance).meta.onCopy = ['runner']
  getGraph(instance).meta.unit = instance.kind = 'effect'
  instance.use = (fn: Function) => {
    if (!isFunction(fn)) throwError('.use argument should be a function')
    handler = fn
    return instance
  }
  const anyway = (instance.finally = createNamedEvent('finally'))
  const done = (instance.done = (anyway as any).filterMap({
    named: 'done',
    fn({status, params, result}: any) {
      if (status === 'done') return {params, result}
    },
  }))
  const fail = (instance.fail = (anyway as any).filterMap({
    named: 'fail',
    fn({status, params, error}: any) {
      if (status === 'fail') return {params, error}
    },
  }))
  const doneData = (instance.doneData = done.map({
    named: 'doneData',
    fn: ({result}: any) => result,
  }))
  const failData = (instance.failData = fail.map({
    named: 'failData',
    fn: ({error}: any) => error,
  }))

  const effectRunner = createNode({
    scope: {
      getHandler: instance.use.getCurrent = () => handler,
      finally: anyway,
    },
    node: [
      step.run({
        fn({params, req}, {finally: anyway, getHandler}, {page, forkPage}) {
          const onResolve = onSettled({
            params,
            req,
            ok: true,
            anyway,
            page,
            forkPage,
          })
          const onReject = onSettled({
            params,
            req,
            ok: false,
            anyway,
            page,
            forkPage,
          })
          let result
          try {
            result = getHandler()(params)
          } catch (err) {
            return void onReject(err)
          }
          if (isObject(result) && isFunction(result.then)) {
            result.then(onResolve, onReject)
          } else {
            onResolve(result)
          }
        },
      }),
    ],
    meta: {
      op: 'fx',
      fx: 'runner',
      onCopy: ['finally'],
    },
  })
  getGraph(instance).scope.runner = effectRunner
  getGraph(instance).seq.push(
    step.compute({
      fn(params, scope, stack) {
        // empty stack means that this node was launched directly
        if (!getParent(stack)) return params
        return {
          params,
          req: {
            rs(data: any) {},
            rj(data: any) {},
          },
        }
      },
    }),
    step.run({
      fn(upd, {runner}, {forkPage}) {
        launch({
          target: runner,
          params: upd,
          defer: true,
          forkPage,
        })
        return upd.params
      },
    }),
  )
  instance.create = (params: Payload) => {
    const req = createDefer()
    launch(instance, {params, req})
    return req.req
  }

  const inFlight = (instance.inFlight = createStore(0, {named: 'inFlight'})
    .on(instance, x => x + 1)
    .on(anyway, x => x - 1))

  const pending = (instance.pending = inFlight.map({
    //@ts-ignore
    fn: amount => amount > 0,
    named: 'pending',
  }))

  own(instance, [
    anyway,
    done,
    fail,
    doneData,
    failData,
    pending,
    inFlight,
    effectRunner,
  ])
  return instance
}

export const onSettled = ({
  params,
  req,
  ok,
  anyway,
  page,
  forkPage,
}: {
  params: any
  req: {
    rs(_: any): any
    rj(_: any): any
  }
  ok: boolean
  anyway: any
  page: any
  forkPage: any
}) => (data: any) =>
  launch({
    target: [anyway, sidechain],
    params: [
      ok
        ? {
            status: 'done',
            params,
            result: data,
          }
        : {
            status: 'fail',
            params,
            error: data,
          },
      {
        fn: ok ? req.rs : req.rj,
        value: data,
      },
    ],
    defer: true,
    page,
    forkPage,
  })

const sidechain = createNode({
  node: [
    step.run({
      fn({fn, value}) {
        fn(value)
      },
    }),
  ],
  meta: {op: 'fx', fx: 'sidechain'},
})
