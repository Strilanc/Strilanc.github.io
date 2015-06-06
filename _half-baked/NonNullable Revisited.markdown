A couple years ago, I wrote a post thinking about [getting non-nullable types into C#](http://twistedoakstudios.com/blog/Post330_non-nullable-types-vs-c-fixing-the-billion-dollar-mistake). A couple weeks ago, nullability tracking showed up in the [C# 7 work list of features](https://github.com/dotnet/roslyn/issues/2136).

So I figured I would try to clarify some of the things from last time.

**All About Defaults**

C# doesn't have a `null` problem, is has a `default(T)` problem. The null problem is just the most prominent way that the `default(T)` problem rears its head. The next most prominent way is that structs always have default constructors.

Every type in C# is required to have a default value, and the existence of these defaults weaves itself everywhere into the design. When an array of type T is allocated, it gets filled up with the default value for that type. When a class has a field of type T, that field is set to that default value before the construction or initialization starts. When an `out` parameter isn't going to be needed, you need *something* to assign to it and that thing is almost always `default(T)`.

When you take away null, you take away a default value. This causes a chain reaction of problems. You want to declare a `List<String!>`, but internally `List` allocates an array of type `T` and when `T=String!` that operation is illegal, and the world shatters in your hands.

Sometimes people suggest requiring that all types be somehow constructable. This is a terrible idea. There are some classes that simply do not have a default value. For example, a class whose constructor checks if its three BigInteger arguments satisfy `a^3 + b^3 == c^3` is not going to be easy to construct. Private constructors. Network streams. Having broken instances is tantamount to having null. Luckily backwards compatibility prevents this road from being even a little tempting.

**The Hard Cases**

There are two big obstacles to removing the assumption of default value: *generics* and *fields*.

In this proposal, we solve the generics problem by adding an opt-in modifier that disables `default(T)`, and a `withdefault(T)` type operation.

We solve the field problem by deferring it. You can't declare non-nullable fields. Classes are responsible for exposing fields as if they were non-nullable, and enforcing that constraint. This bag of worms can be deferred until C# 8.

- Generics. For the entirety of their existence, generics have assumed you can use `default(T)`. With the introduction of non-nullable types, that assumption breaks. This will require "I am not legacy!" annotations and semantic fancyness.
- Fields. Class initialization and finalization relies in several explicit and implicit ways on the existence of a default value. Resurrection.
- 

Covariance. Is an `IEnumerable<String!>` an `IEnumerable<String>`, or do we need glue code?

Type inference. When we say `var a = new Object()`, does `a` have type `Object` or type `Object!`? Should we have a `var!`?

Reflection. What does `typeof(string!)` return? Is there any way to prevent old reflection code from breaking?

**My Proposal: nodefault, withdefault, !**

- **Nonull type**: A type that doesn't permit null values. `int` and `object!` are nonull, but `int?` and `object` are not.
- **Nodefault type**: A type that is not guaranteed to have a default value. `object!` is a nodefault type, but `int`, `int?`, and `object` are not. Type parameters prefixed by `nodefault` may not have a default value, but legacy generic type parameters are by default not nodefault.

**Syntax Changes**

1. Types can be suffixed with `!` to make them nonull. A `T!` is a nodefault type.
2. Generic type parameters can be prefixed with `nodefault`. A `nodefault T` generic parameter allows nodefault types to be given as arguments, and is itself considered to be a nodefault type.
3. Types can be given to a `withdefault` function. `withdefault(T)` strips nonull-ness, in order to always refer to a type that is not nodefault.

**Semantic Changes**

1. A local variable, array entry item, or argument with a nonull type `T!` can store any instance of `T` but can't store null.
    - This is enforced by the C# compiler. It adds runtime checks if necessary for interop with legacy code.
    - `object! a = null` is a compile-time error.
    - `object! a = new object()` is allowed.
    - `f(null)` is a runtime exception if `f` is declared `void f(string! x)`. It can't be a compile-time error, lest updating legacy library code break dependent code. Compiler option to turn it into a compiletime warning or error.
2. A `T!` **is a** `T`.
    - There is an explicit cast from `T` to `T!`, which performs a null check at runtime (if needed; some Ts already can't be null).
    - An explicit cast from value `val` to type `T!` is equivalent to `(T!)(T)val`.
    - There is an implicit cast from `T!` to `T`.
    - An `IEnumerable<T!>!` can be stored in a field of type `IEnumerable<T>` because IEnumerable is covariant.
3. The expression `new X!(...) ` has type `X!`.
    - The expression `new X(...)` still has type `X`.
    - The compiler could help out by inserting automatic casts in unambiguous cases, e.g. `object! o = new object()`.
    - The reason `new X(...)` doesn't have type `X` is legacy baggage: it would change the types inferred by existing code.
4. Arrays of a nodefault type can only be created if items are provided upfront.
    - `new object![0]` is allowed
    - `new object[1]` is **not** allowed
    - `new object[someUnknownInt]` is **not** allowed
    - `new object[]{}` is allowed
    - `new object[]{ new object(), "", 2 }` is allowed
    - It might be convenient to provide a special ArrayBuilder class that internally broke the rules but performed runtime checks to prevent a half-initialized array from escaping.
5. Structs are not allowed to have fields with a nodefault type
    - e.g. Consider what happens when a generic struct with a nodefault generic type parameter has a field of that type. It would have to have a default when the generic type argument had a default (for backwards compatibility), but have no default when the generic type argument had no default. It inherits nodefault-ness from its generic type. I think this would be too confusing, so a wholesale ban it is.
    - It's still fine for a generic struct to have a nodefault generic type parameter; it just can't directly store it on a field. It would instead store it in a withdefault(T) field.

**Notes**

- Redundant "!"s must be allowed semantically, but can be prohibited syntactically. An `object!!` is just an `object!`, an `int!` is just an `int`, and a `double?!` is just a `double`. In practice these situations would occur across the boundaries of a generic type, where the generic class asks for a `T!` and it happens that `T` is an `object!` so the resulting type is `object!!` and gets simplified to `object!`.
- Note that a `T!` **is a** `T`. For example, an `IEnumerable<T!>!` can be stored in a field of type `IEnumerable<T>` because IEnumerable is covariant.
    - Non-nullable types have no default value. The expression `default(object!)` is a compile-time error.
    - Arrays of a non-nullable type can only be created if the values are provided. `new object![0]` is allowed, `new object![] { new object(), new object() }`, is allowed, `new object![] {}` is allowed, but `new object![1]` and `new object![someIntVariable]` are not.
2. Prepending a generic type parameter with “nodefault” means “this parameter is permitted to be a non-nullable type”.
    - This can't be done with a type constraint because type constraints are covariant while non-nullability is contravariant.
    - For legacy compatibility, classes and interfaces that don't declare their parameters to be permitted-non-nullable can't accept non-nullable arguments. If a class is declared as `class C<T>`, then `C<object!>` is a semantic error. The class must be declared as `class C<nodefault T>` instead.
3. The expression `withdefault(T)` strips off any non-nullability at compile time.
    - `withdefault(object!)` is equivalent to `object`
    - `withdefault(object)` is also equivalent to `object`
    - `withdefault(int)` is equivalent to `int`
    - `withdefault(int?)` is equivalent to `int?`
    - `withdefault(int?!)` is equivalent to `int`
    - This is required by use cases where e.g. a backing class wants to store a non-nullable value only in some cases. For example, `List<nodefault T>` may store its items in an array of with `withdefault(T)[]` and cast to `T` on the way out.
4. It is a semantic error to use `default(T)` when `T` is a nodefault generic parameter.
5. An explicit cast to a non-nullable type is performed at runtime by first casting to the nullable type then by doing a null check.
    - `(object!)null` throws a class cast exception at runtime (the compiler is permitted detect it at compile time)
    - When `T` is a nodefault generic parameter, `(T)val` will throw a class cast exception at runtime when val is null and T is a non-nullable type.
6. A struct or class with fields of a non-nullable or nodefault type must have an explicit constructor, and all constructors must start with an intializer list (ala C++).
    - The initializer list initializations run *before* the super-constructor.
    - If an exception occurs before the initializer list initialization is finished, the finalizer **does not run**.
7. The type of a constructor invocation expression is now non-null when the constructed type is a reference type. For example, “new object()” has type “object!”.
    - However, for backwards compatibility, it is inferred as `object` unless you say `var!`.
8. A few existing compiler errors need to be removed.
    - Because a T! is a T, and this works even if T is sealed, disallowing constraining a generic parameter by a sealed type is no longer correct.

**Questions**

- Could C++-style initializer lists make it possible to allow non-nullable fields for classes? (For generic structs it would still a nightmare.)
- Changing `Action<T>` to `Action<nodefault T>` is a breaking change. Same for its 15 other variants, and the sixteen variants of `Func`. Do we need 32 new standard delegates that declare support for non-nullability? How costly will it be for that change to propagate throughout libraries?
- The same can't-make-it-nodefault issue applies to any class that wasn't declared sealed. Like `List<T>`. Why didn't we listen?!

**Sample Code**

A generic class that support non-nullable type arguments. You can almost always just use `withdefault(T)` when declaring storage, then cast back to `T` on the way out:

    // Generic parameters that can accept non-nullable types need to annotated as 'nodefault'.
    // nodefault would be a type constraint, but that makes no sense because it *increases* how many types the class accepts.
    // nodefault is a promise to never use default(T), allocate an uninitialized array of T, pass T into a non-nodefault generic, etc.
    class CappedStack<nodefault T> {

      // withdefault() strips away non-nullability, allowing usage in cases where a default value is needed.
      private withdefault(T)[] items;
      private int count = 0;
      
      public CappedStack(int maxCount) {
        this.items = new withdefault(T)[maxCount];
      }
       
      public void Push(T item) {
        if (count >= maxCount) throw new InvalidOperationException();
           
        // There's an implicit no-op cast from T to withdefault(T).
        items[count] = item;

        count += 1;
      }
       
      public T Pop() {
        if (count <= 0) throw new InvalidOperationException();
        count -= 1;
       
        // Converting from withdefault(T) to T is done with an explicit cast.
        // When T is a non-nullable reference type, this does a runtime null check.
        // Otherwise the cast is a no-op.
        T result = (T)items[count];

        items[count - 1] = default(withdefault(T));
        return result;
      }
      
      // 'out' params is another place where withdefault() comes in very handy (especially for updating legacy code)
      public boolean TryPop(out withdefault(T) result) {
        if (count == 0) {
           result = default(withdefault(T));
           return false;
        }
        
        result = Pop();
        return true;
      }
    }

A non-nullable method:

    void print(string! text) {
        ...
    }



