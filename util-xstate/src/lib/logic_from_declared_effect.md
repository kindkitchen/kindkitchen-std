## Transform effect, declared in context into promise logic

> This is opinionated abstraction over the original `promise_logic_from_effect`
> function.

#### I want to understand how it works!

> As already mentioned earlier - explore
> [./promise_logic_from_effect.md](./promise_logic_from_effect.md) first.

But the core idea is to wrap builtin `fromPromise` actor.

And also utilize context - so we make some conventions, where place actors and
that they should be of some type - and so we declare `input` that is the same as
our `context`... _what a fortune! :D_

#### Pros & Cons

This is a sacrifice of interface independency for sugar usage! The transformer
make assumption about where fn => effect should be placed. It should be placed
in { Actor: Record<name, here!> }. The reason for such design is practical
usage, when such object may simply be a context of the machine.

#### Conclusion

- The Actor[key] has shape as `() => Effect` and it should be located in
  `context.Actor["example"]`.
- So the main goal - is totally free machine from any implementations.
- Though they are still present in context.Actor - possibly it will be mapped
  here from `input`
- Both <Success> and <Error> channels from <Effect> is piped to <onDone> but
  wrapped into <Result>.
- So into <onError> will be passed <Panic>
