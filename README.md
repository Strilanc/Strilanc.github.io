This is the repository that github pulls from when serving my blog at [algorithmicassertions.com](http://algorithmicassertions.com).

The blog is focused on computer science and programming.

Installing dependencies:

```bash
sudo apt install jekyll
sudo apt install python3-pip
python -m pip install pygments
```

Workarounds and hacks:

- Pygments fails if `/usr/bin/python` is python 3 instead of python 2.

Building the site:

```bash
jekyll build
```

Serve from `localhost:4000`:

```bash
jekyll serve
```
