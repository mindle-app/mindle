# Organising subjects in Mindle

## Problem

Subjects are of multiple kinds. And based on the kind of subject the
learning style and verification differs.

1. **Humanities** - Primarily focused on essays and literary analysis
   Ex. Romanian Language, Philosophy, other language studies

   Can contain specific exercises that are not subjectively
   interpreted like grammar exercises.

2. **Sciences** - For subjects like biology, chemistry, where there is a mix of
   concepts and exercises and the learning has a specific order and
   later chapters require concepts from prior chapters.

3. **Mathematics** - For math focused subjects, which would primarily use
   problems and formulas

4. **History** - Similar to humanities but adds the concept of
   timelines, essay based analysis of events and their impacts, study
   of historical figures and their contribution

Based on the type of subject, they will be shown in different styles
to the users.

### Problem for file based routing

Since we are using [Remix](https://remix.run/) and we do file based
routing, we need a way to render the subjects in a way that is
convenient and relatively elegant

## Requirements for solution

The solution needs to support different layout files for all subject types


## Proposed solution

We do a hierarchy of routes like

```sh
/subjects
  $subjectId.tsx # redirect to correct subroute based on subject type
  humanities+/
    layout.tsx
    $subjectId.tsx
  sciencies+/
    $subjectId.tsx
  history+/
    ...

```


Another useful improvement would be to use a slug for the subject so
it would be more SEO friendly
