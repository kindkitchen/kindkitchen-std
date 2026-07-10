# About

This is code-generators for some opinionated xstate declaration strategies.

## What problems it should solve?

The main problem, that this library is try to solve is integration of 2 major
advantages of xstate. So what we are speaking about?

1. Ability to express logic of any difficulty level
2. Ability to produce impressive and interactive state-charts

Though these are the 2 main reasons why I like to use xstate - sometimes I need
to make some sacrifices on one of them to still have both.

So yes, the main problem is that generation of state-charts require from code
some implicit rules and pretty often they are not friendly to developer's
intentions or flavors how this code should be written.

Simply speaking - with machine growing, though logic still be controlled by
xstate the code itself become less readable because of requirements to be parsed
into state-charts.

## How these problems will be solved?

Rude and simple - by code-generation. So this library provide some variants,
templates that will be used as cli command and generate in deterministic way
some parts of machine etc.. So developer will have ability to write code in
different files, use more dynamic stuff etc. - but it will still produce
state-chart friendly machine definitions at once.

**No matter how it sounds to you - awful or cool - the truth is somewhere
between I guess - so below explore both cons and pros that are already known**

## Pros

- Less boilerplate
- More readable code
- Intention to write code with some clean conventions

## Cons

- Obviously these generators as state-charts - in some way also opinionated
  about how your code should be looked
- The patterns, strategies, conventions may not fit your expectations
- Code-generators...

# Implementation progress

1. Declare type of `x` constant that should be auto-generated from minimalistic
   declaration of itself
2. Introduce the idea of **twicert** code-generation
   > The analogy of play words in `upsert` term. But here it means that
   > internally generator will produce some intermediate output and then final.
   > So the developer's config will generate some files and from these files
   > will be generated result. Though it sounds too complicated in fact it is
   > only for simplicity in usage
3. So code-generation will check, does some external files/definitions exists,
   that fit minimalistic input and if no - create them and use, if yes - use at
   once.
4. This intermediate files are the place where developer can more detailed
   extend his definition
5. So instead of introducing more options in initial config - some files-tree
   will be generated - which mirrors initial config
