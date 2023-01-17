---
title: How to prevent computer overload with remote kind clusters
description: >
  Kubernetes can require a lot of resources, which can overload a developer's laptop. This article shows you how to use a set of tools—including kind, kubeconfig, and Podman or Docker—to spread your files around remote systems in support of your local development work.
canonical: https://developers.redhat.com/articles/2023/01/16/how-prevent-computer-overload-remote-kind-clusters
date: 2023-01-16
dir: ltr
lang: en
author:
  name: Tomer Figenblat
  jobTitle: Senior Software Engineer
tags:
- kubernetes
- kind
coverImage: |
  https://developers.redhat.com/sites/default/files/styles/article_feature/public/2020_Kubernetes_Shared_image_A%20%282%29.png?itok=ZQSD_vps
coverImageAlt: cool k8s related jpg
---

<p><a href="/topics/kubernetes">Kubernetes</a> can require a lot of resources, which can overload a developer's laptop. This article shows you how to use a set of tools—including <a href="https://kind.sigs.k8s.io/">kind</a>, <a href="https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/">kubeconfig</a>, and <a href="https://podman.io/">Podman</a> or <a href="https://www.docker.com/">Docker</a>—to spread your files around remote systems in support of your local development work.</p>

<h2>Why I researched tools to prevent computer overload</h2>

<p>Lately, I've been working a lot with <a href="https://open-cluster-management.io/">Open Cluster Management</a>, a community-driven project focused on multicluster and multi-cloud scenarios for Kubenetes applications.</p>

<p>The Open Cluster Management topology is <em>hub-spoke</em> based, calling for one <em>hub</em> cluster and at least one <em>spoke</em> cluster. That means that, throughout my work, I needed at least two clusters running simultaneously.</p>

<p>The quickest way to get two clusters up and running for development purposes is to use&nbsp;<a href="https://kind.sigs.k8s.io/">kind</a>, a Kubernetes management tool. With kind, you can easily spin up Kubernetes clusters running in containers on your local computer.</p>

<p>One of my tasks included working with Prometheus, so I needed multiple clusters running the <a href="https://github.com/prometheus-operator/kube-prometheus">Prometheus operator</a> plus the required operators for running Open Cluster Management, including the <a href="https://open-cluster-management.io/getting-started/integration/app-lifecycle/">Application Lifecycle Manager</a> addon. The load on my local computer was, eventually, too much for it to handle, and it eventually stopped cooperating with me.</p>

<p>To work around this bottleneck, I decided to spread my kind clusters to multiple computers around the office, import their kubeconfig files to my local computer, and continue to work as if the clusters were local.</p>

<p>Each of the remote computers needed to install kind as well as a container engine. To manage the containers I used Podman, but Docker should do just as well.</p>

<p>For access to remote clusters, SSH is usually preferable, but any manner of getting access to them should suffice. After spinning up a kind cluster and exporting the relevant kubeconfig file, you will no longer need access to the remote clusters, with the exception of the designated port 6443 for access to the Kubernetes API server.</p>

<h2>How to set up&nbsp;kind remote clusters</h2>

<p>The remote computer's IP address I use in the following examples is 192.168.1.102.</p>

<p>Assuming you have SSH, connect to the remote computer as follows:</p>

<pre>
<code class="language-bash">$ ssh 192.168.1.102</code></pre>

<p>Create a custom kind cluster using the following command. Note the <code>networking</code> property, which is required to make your cluster's API server listen on the right address so you can reach it from your local computer on the same network:</p>

<pre>
<code class="language-bash">$ kind create cluster --config=- &lt;&lt; EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: remote-cluster1
nodes:
- role: control-plane
networking:
  apiServerAddress: "192.168.1.102"
  apiServerPort: 6443
EOF</code></pre>

<p>Now, still on the remote computer, use kind to export the cluster configuration into a file of your choice; the following command names the file <code>remote_kube_config</code>:</p>

<pre>
<code class="language-bash">$ kind get kubeconfig --name remote-cluster1 &gt; ~/remote_kube_config</code></pre>

<p>Now go <em>back to your local computer</em> and copy your current configuration into a file that I'll call <code>local_kube_config</code>. This file can also serve as a backup:</p>

<pre>
<code class="language-bash">$ cp ~/.kube/config ~/local_kube_config</code></pre>

<p>Then run the following command to copy the remote configuration to your local computer over SSH:</p>

<pre>
<code class="language-bash">$ scp 192.168.1.102:~/remote_kube_config ~</code></pre>

<p>Now merge the two configuration files. Note that if you have many remote clusters, you can include multiple configuration files in the following command:</p>

<pre>
<code class="language-bash">$ KUBECONFIG="${HOME}/local_kube_config:${HOME}/remote_kube_config" kubectl config view --flatten &gt; ~/.kube/config</code></pre>

<p>Verify access to your remote kind cluster from your local computer:</p>

<pre>
<code class="language-bash">$ kubectl get nodes --context kind-remote-cluster1

NAME                            STATUS   ROLES           AGE   VERSION
remote-cluster1-control-plane   Ready    control-plane   19m   v1.25.3</code></pre>

<p>The output shows that you have access to the cluster.</p>

<h4>Bonus: Loading images to remote clusters</h4>

<p>When you need to load images from your local storage to a&nbsp;local kind cluster, you can take advantage of the following useful command:</p>

<pre>
<code class="language-bash">$ kind load docker-image &lt;image-registry&gt;/&lt;image-owner&gt;/&lt;image-name&gt;:&lt;image-tag&gt; --name local-cluster</code></pre>

<p>But when working with remote clusters, this process gets tricky. In the previous section, you made kubectl aware of your remote cluster by merging its <code>kubeconfig</code> configuration, but your local instance of kind has no idea who <code>remote-cluster1</code> is.</p>

<p>Images can be loaded only to local kind clusters. This means that to load a file onto a remote computer, you need to get your image into your remote computer's storage and load it from there.</p>

<p>To do that, first archive your image:</p>

<pre>
<code class="language-bash">$ podman save &lt;image-registry&gt;/&lt;image-owner&gt;/&lt;image-name&gt;:&lt;image-tag&gt; -o archive-file-name</code></pre>

<p>Then copy the archive to your remote computer:</p>

<pre>
<code class="language-bash">$ scp archive-file-name 192.168.1.102:~</code></pre>

<p>Connect using SSH to the remote computer:</p>

<pre>
<code class="language-bash">$ ssh 192.168.1.102</code></pre>

<p>And load the archive as an image to your kind cluster:</p>

<pre>
<code class="language-bash">$ kind load image-archive archive-file-name --name remote-cluster1</code></pre>

<h2>Tools that simplify&nbsp;Kubernetes</h2>

<p>For more information on tools that simplify work with Kubernetes, visit Red Hat's <a href="/topics/developer-tools">Developer Tools</a> page. Please check out my next article, <a href="https://developers.redhat.com/articles/2023/01/19/how-distribute-workloads-using-open-cluster-management">How to distribute workloads using Open Cluster Management</a>. Feel free to comment below if you have questions. We welcome your feedback. Have a great day, and keep up the good work!</p>
