- not indicative of skill

I was working on the signal zrtp handshake

I wanted to know where every bit came from. I hand generated test data.

I grabbed a packet trace of what redphone did (and captured the private keys by modifying the code to log it)

There was a discrepancy

I investigated it.

System.arraycopy arguments were reversed

Thankfully, of all the entropy you could zero, this was probably the best.
It broke [ind-cpa](https://en.wikipedia.org/wiki/Ciphertext_indistinguishability#Indistinguishability_under_chosen-plaintext_attack_.28IND-CPA.29), instead of the whole protocol.


