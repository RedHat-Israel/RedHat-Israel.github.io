# Red Hat Israel

## Getting Started

### 1. Clone this Repository

```
git clone https://github.com/RedHat-Israel/RedHat-Israel.github.io
```

### 2. Navigate to the directory

```
cd RedHat-Israel.github.io
```

### 3. Install dependencies

```
npm ci
```

### 4. Run Eleventy Dev Server

build and host locally for local development

```
npm start
```

Or build the site for deployment

```
npx @11ty/eleventy
```

Or build automatically when a template changes:

```
npx @11ty/eleventy --watch
```

Or in debug mode:

```
DEBUG=* npx @11ty/eleventy
```
