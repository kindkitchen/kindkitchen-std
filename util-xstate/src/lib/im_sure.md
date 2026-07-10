## `im_sure.*` semantic

> As a developer I'm sure, that in this place I can do this or this.

This is mostly helpers, that tip typescript **without** actual check. Make some
simple transformation.

#### What is the goal?

Make code more readable, enforce to be in touch with some conventions to be sure
in some expectations.

#### How I can be sure?

As mentioned earlier - if you follow the convention, declared in documentation -
you can expect some behavior etc. So be careful - this may turn against you if
you ignore it.

## Context of this statements

The main part of assumptions is related to `xstate` - `effect` integration.

- Actor, resolved with `onDone` explicitly converted to effect's `Result` type.
  So instead of success - the `failure` _(controlled fail)_ and `success`
  _(actual success)_ flows are represented.
- `onError` still real, unexpected _panic_ place - still be **unknown**
- All these happen in convenient way in the internal states of some _parent_
  state, which is contained _effect-full_ **actor**
- The declaration of such flow expected to be _copy-pasted_
- The _business_ state with such actor has private children:
  - _Enter_
  - _Compute_
  - _Done_
  - _Success_
  - _Exception_
  - _Error_

#### So with correct usage - **you can be sure in some types, possibility to make some transformations, etc.**
