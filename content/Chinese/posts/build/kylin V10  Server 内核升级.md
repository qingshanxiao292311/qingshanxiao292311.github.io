---

title: "Kylin V10 Server 内核升级"
date: 2025-10-10
draft: false
author: "肖青山"
lastmod: 2025-10-12
draft: false  # 设为 false 发布
categories: ["kylin"]
tags: ["OS", "kernel", "build"]
---

​	由于`kylin V10 server` 内核版本是`4.19.90-25.10.v2101.ky10.aarch64`，当前内核版本过低，导致有些功能不支持或支持不完成，比如`io_uring，bpf`等。为了支持新内核的功能，故需要升级`kylin v10 server` 的内核版本。

​	本文使用OpenEuler 5.10.0的内核升级。



# 1. 内核源码编译rpm包

## 1.1 环境准备

`Kylin v10 server` 虚拟机

## 1.2 依赖包安装

```
sudo dnf install -y rpm-build make gcc bc bison flex elfutils-libelf-devel openssl-devel ncurses-devel git wget
```

## 1.3 手动编译依赖包

- 下载`dwarves`源码编译安装

  ```
  git clone https://github.com/acmel/dwarves.git
  git checkout v1.22
  cd dwarves
  mkdir build
  cd build
  cmake -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr ..
  make install
  ```

  

- 下载高版本的`clang`二进制安装

  ```
  wget https://github.com/llvm/llvm-project/releases/download/llvmorg-14.0.1/clang+llvm-14.0.1-aarch64-linux-gnu.tar.xz
  xz -d clang-llvm-xxx
  mv clang-llvm clang
  mv clang /opt/
  echo "export PATH=/opt/clang/bin:$PATH" >> ~/.bashrc
  ```

  

- 下载`libtraceevent` 编译安装

  ```
  wget https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git
  make 
  make install
  ```

  

## 1.3 创建 rpmbuild 目录结构

```
mkdir -p ~/rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}

echo '%_topdir %(echo $HOME)/rpmbuild' > ~/.rpmmacros
```



## 1. 4获取内核源码

```
在欧拉系统下执行：

sudo dnf download --source kernel

执行后会得到一个类型这样的包： kernel-5.10.0-283.0.0.185.oe2203sp3.src.rpm
```



## 1.5 解包

```
rpm -ivh kernel-5.10.0-283.0.0.185.oe2203sp3.src.rpm

执行后自动把源码和 .spec 文件放到 ~/rpmbuild/SOURCES/ 和 ~/rpmbuild/SPECS/ 下。

```

## 1.6 补丁

```
所有补丁文件（.patch）必须放到 ~/rpmbuild/SOURCES/ 下

修改 .spec 文件

假设你打的补丁文件名为：myfix.patch

编辑 ~/rpmbuild/SPECS/kernel.spec，主要改两个地方：

1. 在 Source / Patch 定义区 添加补丁引用

找到文件开头类似：

Source0: kernel-5.10.tar.xz

Patch0: some-official-fix.patch  # 补丁编号自定义

2. 在 %prep 阶段 应用补丁

在 .spec 文件中找到 %prep 段：

例：

%prep

%setup -q

%patch0 -p1

说明：

%patchN 中的 N 必须与上面的 PatchN: 对应。

-p1 表示打补丁时去掉一级路径前缀（通常 git 生成的 patch 是 -p1 形式）。

如果你的补丁路径结构不同，可以调整为 -p0、-p2。

3. 验证补丁是否生效

rpmbuild -bp kernel.spec

这一步只执行到 %prep，不会实际编译。

成功后进入：

~/rpmbuild/BUILD/kernel-5.10.x/

查看补丁文件的变更是否已经生效。
```



## 1.7 编辑修改 SPEC 文件

```
vim /root/rpmbuild/SPEC/kernel.spec
```

这些修改都是基于`4.19`内核，后面会说到为什么要修改这些

- 修改1

```
%define with_kabichk 0  # 关闭with_kabichk 检查

# BuildRequire: dwarves   

# BuildRequire: clang >=10.0.0

# BuildRequire: llvm  

```

- 修改2

```
单独执行这两行
 gzip -c9 < Module.symvers > $RPM_BUILD_ROOT/boot/symvers-%{KernelVer}.gz
/boot/symvers-*
本来是
%if 0%{?with_kabichk}
     gzip -c9 < Module.symvers > $RPM_BUILD_ROOT/boot/symvers-%{KernelVer}.gz
%endif
%if 0%{?with_kabichk}
	/boot/symvers-*
%endif
```

- 修改3

```

while read i
do
    abs_path="$(readlink -f "$i")"
    echo -n "$abs_path " >> modinfo
    if /sbin/modinfo -l "$abs_path" >> modinfo 2>/dev/null; then
        # modinfo 成功，继续
        :
    else
        # 回退：使用 strings 提取 license
        license=$(strings "$abs_path" | grep '^license=' | head -1 | cut -d'=' -f2- || echo "UNKNOWN")
        if [[ "$license" != "UNKNOWN" ]]; then
            echo "$license" >> modinfo
        else
            echo "Warning: license extraction failed on $i" >> modinfo
        fi
    fi
done < modnames
```



## 1.8 准备内核配置

```

默认使用rpmbuild/BUILD/arch/arm64/config/openeuler_defconfig配置文件
若要使用自定义的配置：
cp /boot/config-$(uname -r) ~/rpmbuild/SOURCES/config.local

并在 kernel.spec 中修改配置加载，并要避免被openeuler_defconfig配置文件覆盖
```



## 1.9 编译

```
rpmbuild -ba kernel.spec  2>&1 | tee rpm_build.log # 编译输出到rpm_build.log文件

安装缺少的包

参数说明：

-b：构建类型

-a：表示构建二进制和源码包（相当于 rpmbuild -bb + rpmbuild -bs）
```



## 1.10 编译完成

```
编译完成后，会在：

~/rpmbuild/RPMS/aarch64/

生成多个 RPM 包

[root@localhost aarch64]# ls

kernel-5.10.0-283.0.0.185.aarch64.rpm       

kernel-source-5.10.0-283.0.0.185.aarch64.rpm      

perf-debuginfo-5.10.0-283.0.0.185.aarch64.rpm

kernel-debuginfo-5.10.0-283.0.0.185.aarch64.rpm   

kernel-tools-5.10.0-283.0.0.185.aarch64.rpm       

python3-perf-5.10.0-283.0.0.185.aarch64.rpm

kernel-debugsource-5.10.0-283.0.0.185.aarch64.rpm  

kernel-tools-debuginfo-5.10.0-283.0.0.185.aarch64.rpm  

python3-perf-debuginfo-5.10.0-283.0.0.185.aarch64.rpm

kernel-devel-5.10.0-283.0.0.185.aarch64.rpm     

kernel-tools-devel-5.10.0-283.0.0.185.aarch64.rpm

kernel-headers-5.10.0-283.0.0.185.aarch64.rpm    

perf-5.10.0-283.0.0.185.aarch64.rpm
```



## 1.11 安装验证

```
先关闭selinux 

sudo rpm -ivh ~/rpmbuild/RPMS/aarch64/kernel-*.rpm

更新 grub：

grub2-mkconfig -o /boot/efi/EFI/kylin/grub.cfg #kylin 系统是更新这个文件

sudo reboot

uname -r

启动时：openeuler，centos， kylinos 使用的是/boot/efi/EFI/kylin/grub.cfg 

查看启动项引用的 grub.cfg：efibootmgr -v
```

# 2. 编译安装过程遇到的问题



## 1. 问题1



```
编译过程问题描述：pahole unavailable

原因：没有安装dwarves包导致，kylinos下没有这个包

解决办法：下载dwarves源码编译安装
```

## 2. 问题2 

```
 问题描述： 内核ABI（Application Binary Interface） 校验失败

 LD [M] sound/soundcore.ko

\+ chmod 0755 /root/rpmbuild/SOURCES/check-kabi

\+ '[' -e /root/rpmbuild/SOURCES/Module.kabi_aarch64 ']'

\+ /root/rpmbuild/SOURCES/check-kabi -k /root/rpmbuild/SOURCES/Module.kabi_aarch64 -s Module.symvers

*** ERROR - ABI BREAKAGE WAS DETECTED ***

The following symbols have been changed (this will cause an ABI breakage):

new kabi:

0xcc1d5767   acpi_bus_get_device   vmlinux EXPORT_SYMBOL

......

问题分析：

[root@localhost rpmbuild]# grep acpi_bus_get_device SOURCES/Module.kabi_aarch64

0x035041f7	acpi_bus_get_device	vmlinux	EXPORT_SYMBOL	 

new kabi 与SOURCES/Module.kabi_aarch64 中的symbol不一致

解决办法：

QA_SKIP_KABI_CHECK=1 rpmbuild -ba SPECS/kernel.spec # 编译时跳过abi检查 

或

修改kernel.spec

%define with_kabichk 0  # 关闭with_kabichk 检查，本文采用的这种方式
```

## 3. 问题3

```
问题描述：

clang -O2 -g -Wall -target bpf -I../../tools/lib -I../../tools/include/uapi/ -c netaccsockmap.c -o netaccsockmap.o

../../tools/bpf/bpftool/bpftool gen skeleton netaccsockmap.o > netaccsockmap.skel.h

libbpf: sec 'sk_msg': failed to find program symbol at offset 0

Error: failed to open BPF object file: BPF object format invalid

make: *** [Makefile:13: all] Error 255

++ echo 'Error at line 83'

Error at line 83

++ exit 1

问题分析：

clang版本太低导致， 升级到10.0.0以上

解决办法：

下载clang 二进制: wget https://github.com/llvm/llvm-project/releases/download/llvmorg-14.0.1/clang+llvm-14.0.1-aarch64-linux-gnu.tar.xz

tar -zxf xxxx.tar.xz 

mv clang-llvm-xxx clang 

mv clang /opt/

vim ~/.bashrc  

export PATH=/opt/clang/bin:$PATH
```

## 4. 问题4

```
问题：在安装阶段报找不到cts.ko模块

read i

echo -n './kernel/crypto/cts.ko '

/sbin/modinfo -l ./kernel/crypto/cts.ko

modinfo: ERROR: could not get modinfo from 'cts': No such file or directory

其实存在，路径不对而已：

[root@localhost rpmbuild]# find . -name cts.ko

./BUILD/kernel-5.10.0/linux-5.10.0-283.0.0.185.test.ky10.aarch64/crypto/cts.ko

./BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/lib/modules/5.10.0-283.0.0.185.test.ky10.aarch64/kernel/crypto/cts.ko

修改spec文件中的%install, 添加绝对路径

while read i

do

  abs_path="$(readlink -f "$i")"

  echo -n "$i " >> modinfo

  /sbin/modinfo -l "$abs_path" >> modinfo || echo "Warning: modinfo failed on $i" >> modinfo

done < modnames

[root@localhost rpmbuild]# strace -e openat /sbin/modinfo -l ./kernel/crypto/cts.ko

openat(AT_FDCWD, "/dev/cur_gl", O_RDONLY|O_CLOEXEC) = -1 ENOENT (没有那个文件或目录)

openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/liblzma.so.5", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libz.so.1", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libcrypto.so.1.1", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libgcc_s.so.1", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libc.so.6", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libpthread.so.0", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/usr/lib64/libdl.so.2", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/lib/modules/4.19.90-25.10.v2101.ky10.aarch64/modules.softdep", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/proc/cmdline", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/lib/modules/4.19.90-25.10.v2101.ky10.aarch64/modules.dep.bin", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/lib/modules/4.19.90-25.10.v2101.ky10.aarch64/modules.alias.bin", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/lib/modules/4.19.90-25.10.v2101.ky10.aarch64/modules.builtin.alias.bin", O_RDONLY|O_CLOEXEC) = 3

openat(AT_FDCWD, "/lib/modules/4.19.90-25.10.v2101.ky10.aarch64/modules.builtin.bin", O_RDONLY|O_CLOEXEC) = 3

modinfo: ERROR: Module ./kernel/crypto/cts.ko not found.
```

## 5. 问题5

```
获取不到某些模块的license tag

 /sbin/modinfo -l /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/lib/modules/5.10.0-283.0.0.185.test.ky10.aarch64/kernel/fs/xfs/xfs.ko 

modinfo: ERROR: could not get modinfo from 'xfs': No such file or directory

正常模块：

[root@localhost rpmbuild]# /sbin/modinfo -l /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/lib/modules/5.10.0-283.0.0.185.test.ky10.aarch64/kernel/lib/crc64.ko

GPL v2

原因：在 4.19 内核环境（kmod 27）下编译针对 5.10 内核的模块时，modinfo 工具会因为内核模块的 ELF 格式（特别是 .modinfo 节的结构和对齐）变化而失败。这不是文件不存在，而是 kmod 库在解析新版模块的二进制布局时内部出错（返回 ENOENT 错误码，导致 "No such file or directory" 提示）。从 4.19 到 5.10，内核引入了多项 ELF 优化（如符号处理和节压缩支持），旧版 kmod 无法完全兼容，导致提取许可证等元数据失败。

由于内核版本是4.19，modinfo 依赖与kmod，版本与oe2203 5.10内核（kmod 29）下的版本不一致

解决办法：修改kernel.spec

改用 strings 获取

[root@localhost rpmbuild]# strings ./BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/lib/modules/5.10.0-283.0.0.185.test.ky10.aarch64/kernel/fs/xfs/xfs.ko | grep '^license='

license=GPL

.......

while read i

do

  abs_path="$(readlink -f "$i")"

  echo -n "$abs_path " >> modinfo

  if /sbin/modinfo -l "$abs_path" >> modinfo 2>/dev/null; then

    \# modinfo 成功，继续

    :

  else

    \# 回退：使用 strings 提取 license

    license=$(strings "$abs_path" | grep '^license=' | head -1 | cut -d'=' -f2- || echo "UNKNOWN")

    if [[ "$license" != "UNKNOWN" ]]; then
      echo "$license" >> modinfo

    else

      echo "Warning: license extraction failed on $i" >> modinfo

    fi

  fi

done < modnames

\#while read i

\#do

\#  abs_path="$(readlink -f "$i")"

\#  echo -n "$abs_path " >> modinfo

\#  /sbin/modinfo -l "$abs_path" >> modinfo || echo "Warning: modinfo failed on $i" >> modinfo

\#done < modnames

grep -E -v '^(Warning: |UNKNOWN$)' | grep -E -v \

​     'GPL( v2)?$|Dual BSD/GPL$|Dual MPL/GPL$|GPL and additional rights$' \

 modinfo && exit 1
```

## 6. 问题6

```

在install阶段报错：

Compiling /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/iocost_coef_gen.py ...

 File "/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/iocost_coef_gen.py", line 62

  devname = subprocess.run(f'findmnt -nvo SOURCE -T{path}',

                              ^

SyntaxError: invalid syntax

Compiling /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/iocost_monitor.py ...

 File "/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/iocost_monitor.py", line 38

  print(s, file=sys.stderr, flush=True)

         ^

SyntaxError: invalid syntax

Compiling /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/memcg_slabinfo.py ...

 File "/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/cgroup/memcg_slabinfo.py", line 32

  print('slabinfo.py: error: %s' % s, file=sys.stderr, flush=True)

                      ^

SyntaxError: invalid syntax

Compiling /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/testing/kunit/kunit.py ...

 File "/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/testing/kunit/kunit.py", line 53

  def config_tests(linux: kunit_kernel.LinuxSourceTree,

             ^

SyntaxError: invalid syntax

Compiling /root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/testing/kunit/kunit_config.py ...

 File "/usr/src/linux-5.10.0-283.0.0.185.test.ky10.aarch64/tools/testing/kunit/kunit_config.py", line 19

  def __str__(self) -> str:

           ^

SyntaxError: invalid syntax

原因：这是python3 才支持的语法

而kylin v10 server 默认使用的python2.7

解决办法：

rm -rf /usr/bin/python

sudo ln -sf /usr/bin/python3 /usr/bin/python
```

## 7. 问题7

```
在install阶段报错：

Requires(post): /bin/sh

kernel-tools-5.10.0-283.0.0.185.test.ky10.aarch64 错误：没有找到文件：/root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/share/man/man1/kvm_stat*

原因：
kernel.spec文件中屏蔽了with_perf选项，导致不会新建/root/rpmbuild/BUILDROOT/kernel-5.10.0-283.0.0.185.test.ky10.aarch64/usr/share/man/man1/目录，

解决办法：放开with_perf, 但是其依赖libtraceevent-devel包

下载libtraceevent源码编译安装
```

## 8. 问题8

```
编译成功后，安装kernel-5.10.0-238.xxxx.rpm失败

[root@localhost aarch64]# rpm -Uvh kernel-5.10.0-283.0.0.185.test.ky10.aarch64.rpm --force

Verifying...             ################################# [100%]

准备中...             ################################# [100%]

正在升级/安装...

  1:kernel-5.10.0-283.0.0.185.test.ky################################# [ 50%]

正在清理/删除...

  2:kernel-5.10.0-283.0.0.185.test.ky################################# [100%]

Error! Bad return status for module build on kernel: 5.10.0-283.0.0.185.test.ky10.aarch64 (aarch64)

Consult /var/lib/dkms/nvidia/460.84/build/make.log for more information.

Symvers dump file /boot/symvers-5.10.0-283.0.0.185.test.ky10.aarch64.gz not found

警告：%posttrans(kernel-5.10.0-283.0.0.185.test.ky10.aarch64) 脚本执行失败，退出状态码为 1

原因：kernel-5.10.0-283.0.0.185.test.ky10.aarch64.rpm 中缺少/boot/symvers-5.10.0-283.0.0.185.test.ky10.aarch64.gz文件

这是由于kernel.spec中with_kabichk选项被屏蔽导致：

 501 %if 0%{?with_kabichk}

 502   gzip -c9 < Module.symvers > $RPM_BUILD_ROOT/boot/symvers-%{KernelVer}.gz

 503 %endif

 851 %if 0%{?with_kabichk}

 852 /boot/symvers-*

 853 %endif

但是不屏蔽，在kernel.spec中执行%{SOURCE18} -k $RPM_SOURCE_DIR/Module.kabi_%{_target_cpu} -s Module.symvers 又通不过。

解决办法：单独执行这两行

 gzip -c9 < Module.symvers > $RPM_BUILD_ROOT/boot/symvers-%{KernelVer}.gz

/boot/symvers-*

```

## 9. 问题9

```
问题现象：用户登录一直在界面循环，ssh远程失败

原因：Kylin（基于openEuler但有定制策略）和openEuler的SELinux政策/标签定义可能不完全兼容。内核升级时，initramfs或文件标签未正确迁移，导致root的sysadm_u映射失效，PAM会话无法建立（日志中res=failed和grantors=?确认了这一点）。这在ARM架构（aarch64，从日志可见）上更常见，因为Kylin V10针对国产化优化，而openEuler的5.10内核可能缺少特定模块或默认标签。

图形登录循环和SSH root失败都源于此：GDM/SSHD依赖PAM的SELinux上下文切换

解决办法：在旧内核下关闭selinux 

vim /etc/selinux/config  修改SELINUX=enforcing 为permissive
```

