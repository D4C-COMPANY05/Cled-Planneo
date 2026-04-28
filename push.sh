#!/bin/bash

REPO_NAME="Cled-Planneo"
USERNAME="D4C-COMPANY05"

git config --global user.name "$USERNAME"
git config --global user.email "d4c.company05@gmail.com"

# Init repo si pas encore fait
if [ ! -d ".git" ]; then
  git init
fi

# Detect branch
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
  git branch -M main
  BRANCH="main"
fi

# Créer le repo GitHub si pas existant
gh repo view "$USERNAME/$REPO_NAME" > /dev/null 2>&1 || \
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

# Si remote déjà existant, on continue
git remote get-url origin > /dev/null 2>&1 || \
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

git add .

git diff --cached --quiet || git commit -m "${1:-Auto commit}"

git push -u origin $BRANCH --force